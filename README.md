spring.application.name=wealth-core

# ===============================
# H2 Database
# ===============================
spring.datasource.url=jdbc:h2:file:./data/wealthcore;AUTO_SERVER=TRUE
spring.datasource.driver-class-name=org.h2.Driver
spring.datasource.username=sa
spring.datasource.password=

# ===============================
# JPA / Hibernate
# ===============================
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.open-in-view=false
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# ===============================
# Flyway
# ===============================
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration

# ===============================
# H2 Console
# ===============================
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console

# ===============================
# Server
# ===============================
server.port=8080
server.servlet.context-path=/api