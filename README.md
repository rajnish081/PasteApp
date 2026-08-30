package com.sc.wealthcore.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sc.wealthcore.dto.DemoDataFile;
import com.sc.wealthcore.entity.AccountTransaction;
import com.sc.wealthcore.entity.Customer;
import com.sc.wealthcore.entity.Product;
import com.sc.wealthcore.entity.RelationshipManager;
import com.sc.wealthcore.repository.CustomerRepository;
import com.sc.wealthcore.repository.RelationshipManagerRepository;
import java.io.IOException;
import java.io.InputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Owner: Rajnish. Loads the demo book on startup.
 *
 * <p><strong>Why this is not a migration.</strong> Flyway owns the schema, because schema
 * changes are destructive and have to be applied in order on every machine. Demo data is
 * neither: it changes several times a week during a sprint, and migrations are append-only,
 * so every tweak to a pushed seed means yet another migration on top of it. Here you edit
 * {@code demo-data.json} and restart.
 *
 * <p>The RM row itself stays in V3 — {@code customer.rm_id} references it, so it has to
 * exist before Flyway hands over. This sets its password and adds everything below it.
 *
 * <p>Two guards make re-running safe: the whole thing is off unless
 * {@code wealthcore.demo.seed-enabled} is set, and it skips if customers already exist.
 * Without the second guard, every restart would duplicate the book.
 */
@Component
public class DemoDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    /** The placeholder V3 inserts. BCrypt never matches it, so the account cannot be used. */
    private static final String UNUSABLE_HASH = "!";

    private static final String DATA_FILE = "demo-data.json";

    private final RelationshipManagerRepository relationshipManagers;
    private final CustomerRepository customers;
    private final PasswordEncoder passwordEncoder;
    private final DemoProperties properties;
    private final ObjectMapper objectMapper;

    public DemoDataSeeder(RelationshipManagerRepository relationshipManagers,
                          CustomerRepository customers,
                          PasswordEncoder passwordEncoder,
                          DemoProperties properties,
                          ObjectMapper objectMapper) {
        this.relationshipManagers = relationshipManagers;
        this.customers = customers;
        this.passwordEncoder = passwordEncoder;
        this.properties = properties;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!properties.isSeedEnabled()) return;

        RelationshipManager rm = relationshipManagers
                .findByUsernameIgnoreCase(properties.getRmUsername())
                .orElse(null);

        if (rm == null) {
            log.warn("RM {} is not in the database — did V3__seed_relationship_manager.sql run?",
                    properties.getRmUsername());
            return;
        }

        setDemoPassword(rm);
        seedCustomers(rm);
    }

    private void setDemoPassword(RelationshipManager rm) {
        if (properties.getRmPassword() == null || properties.getRmPassword().isBlank()) {
            log.warn("wealthcore.demo.rm-password is empty — {} will have no usable password.",
                    rm.getUsername());
            return;
        }

        if (!UNUSABLE_HASH.equals(rm.getPasswordHash())) {
            // Somebody already has a working password. A restart must never reset it.
            log.info("RM {} already has a password — leaving it alone.", rm.getUsername());
            return;
        }

        rm.setPasswordHash(passwordEncoder.encode(properties.getRmPassword()));
        relationshipManagers.save(rm);
        // The password itself is never logged, only that it was set.
        log.info("Set the demo password for {} from wealthcore.demo.rm-password.", rm.getUsername());
    }

    private void seedCustomers(RelationshipManager rm) {
        long existing = customers.count();
        if (existing > 0) {
            // Idempotence. Without this, every restart would append a second copy of the book.
            log.info("{} customers already present — not seeding.", existing);
            return;
        }

        DemoDataFile data = read();
        if (data == null) return;

        data.customers().forEach(source -> {
            Customer customer = new Customer(
                    source.id(), rm, source.name(), source.nameZh(), source.email(),
                    source.tier(), source.segment(), source.risk(), source.priority(),
                    source.portfolioValue(), source.nextDueDate(),
                    source.dueCategory(), source.dueReason(), source.dueAmount());

            source.products().forEach(p -> customer.addProduct(new Product(
                    p.id(), p.type(), p.name(), p.value(),
                    p.maturityDate(), p.dueDate(), p.status())));

            source.transactions().forEach(t -> customer.addTransaction(new AccountTransaction(
                    t.id(), t.date(), t.description(), t.amount())));

            // Products and transactions cascade from the customer.
            customers.save(customer);
        });

        log.info("Seeded {} customers from {}.", data.customers().size(), DATA_FILE);
    }

    private DemoDataFile read() {
        try (InputStream in = new ClassPathResource(DATA_FILE).getInputStream()) {
            return objectMapper.readValue(in, DemoDataFile.class);
        } catch (IOException e) {
            // Never fatal. A malformed demo file should not stop the application from
            // starting — the API still works, there is just nothing in it.
            log.error("Could not read {} — starting with an empty book.", DATA_FILE, e);
            return null;
        }
    }
}
