package com.sc.wealthcore.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

/**
 * Owner: Rajnish — US03.
 *
 * Session-cookie authentication. There is no JWT: the browser holds a JSESSIONID and
 * the server holds the session, which is what the user story specifies and what lets
 * logout genuinely invalidate access.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    @Order(1)
    public SecurityFilterChain apiFilterChain(HttpSecurity http) throws Exception {
        // Cookie-based CSRF so the SPA can read the token and echo it back as a header.
        //
        // Spring Security 6 ships XorCsrfTokenRequestAttributeHandler by default, which
        // defers resolving the token until something reads the request attribute. For an
        // SPA that never renders a server-side form, nothing ever reads it, so the cookie
        // is never written and every mutating request 403s. Using the plain handler with
        // a null attribute name opts out of that deferral.
        CsrfTokenRequestAttributeHandler csrfHandler = new CsrfTokenRequestAttributeHandler();
        csrfHandler.setCsrfRequestAttributeName(null);

        http
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(csrfHandler))

            .authorizeHttpRequests(auth -> auth
                // The login flow itself must be reachable without a session.
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                // API docs. Public because this is a demo build — before anything ships,
                // put these behind authentication: they enumerate every endpoint.
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                // Everything else, including /rm/me, needs one.
                .anyRequest().authenticated())

            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                // A new session id is issued the moment the second factor passes, so a
                // session id observed during the pre-auth phase cannot be replayed as an
                // authenticated one.
                .sessionFixation(sessionFixation -> sessionFixation.newSession()))

            // No login page and no HTTP Basic prompt — an unauthenticated API call gets a
            // clean 401 for the SPA to handle, not a redirect or a browser dialog.
            .exceptionHandling(ex -> ex.authenticationEntryPoint(
                (request, response, authException) -> response.sendError(401)))

            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .logout(logout -> logout.disable());

        return http.build();
    }

    /**
     * Dev only. The H2 console needs frames and its own CSRF exemption, neither of which
     * belongs anywhere near the API chain. Guarded by @Profile so it cannot leak into a
     * deployed build — the console is a remote code execution surface.
     */
    @Bean
    @Order(0)
    @Profile("dev")
    public SecurityFilterChain h2ConsoleFilterChain(HttpSecurity http) throws Exception {
        http
            // Plain string, not AntPathRequestMatcher: that class is deprecated for
            // removal in Spring Security 6.5 and gone in 7. This overload does the same
            // job with no import and no deprecation.
            .securityMatcher("/h2-console/**")
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .csrf(csrf -> csrf.disable())
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
            .formLogin(Customizer.withDefaults());
        return http.build();
    }
}
