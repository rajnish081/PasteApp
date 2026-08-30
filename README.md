package com.sc.wealthcore.exception;

import java.util.Map;
import org.springframework.http.HttpStatus;

/**
 * Owner: Rajnish. Base for every exception the API deliberately returns to a client.
 *
 * <p>Two messages, on purpose:
 * <ul>
 *   <li>{@code clientMessage} — safe to display, and all that reaches the browser.</li>
 *   <li>{@code getMessage()} — the real reason, for the log only.</li>
 * </ul>
 *
 * <p>That split is what lets the sign-in failures stay indistinguishable to an attacker
 * while remaining debuggable for us. Anything thrown that is <em>not</em> an ApiException
 * is treated as a bug and becomes a generic 500.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String code;
    private final String clientMessage;
    private final transient Map<String, Object> details;

    public ApiException(HttpStatus status, String code, String clientMessage, String logMessage) {
        this(status, code, clientMessage, logMessage, null);
    }

    public ApiException(HttpStatus status, String code, String clientMessage, String logMessage,
                        Map<String, Object> details) {
        super(logMessage);
        this.status = status;
        this.code = code;
        this.clientMessage = clientMessage;
        this.details = details;
    }

    public HttpStatus getStatus() { return status; }
    public String getCode() { return code; }
    public String getClientMessage() { return clientMessage; }
    public Map<String, Object> getDetails() { return details; }
}





package com.sc.wealthcore.exception;

import java.util.Map;
import org.springframework.http.HttpStatus;

/**
 * Owner: Rajnish — US03. The sign-in failures, in one place so the wording that reaches
 * the browser can be checked at a glance.
 *
 * <p>The single most important property here: {@link InvalidCredentials} is thrown for an
 * unknown user ID <em>and</em> for a wrong password, with an identical body. An attacker
 * who tries a million user IDs learns nothing about which ones exist.
 */
public final class AuthExceptions {

    private AuthExceptions() {}

    /** The one generic message. Used for every credential failure, whatever the cause. */
    public static final String GENERIC = "Invalid user ID or password";

    public static class InvalidCredentials extends ApiException {
        public InvalidCredentials(String logMessage) {
            super(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", GENERIC, logMessage);
        }
    }

    /**
     * 423 rather than the generic 401.
     *
     * <p>This does not leak account existence, because failures are counted for usernames
     * that do not exist as well — a made-up user ID locks out exactly like a real one. So
     * the RM gets a message they can act on without handing anyone an enumeration oracle.
     */
    public static class AccountLocked extends ApiException {
        public AccountLocked(long retryAfterSeconds, String logMessage) {
            super(HttpStatus.LOCKED, "ACCOUNT_LOCKED",
                    "Too many sign-in attempts. Try again later.",
                    logMessage,
                    Map.of("retryAfterSeconds", retryAfterSeconds));
        }
    }

    /**
     * Carries a fresh challenge so the browser never has to make a second call to render
     * the form — and so the previous challenge, now consumed, is always replaced.
     */
    public static class CaptchaRequired extends ApiException {
        public CaptchaRequired(String imageDataUri, long expiresInSeconds, String clientMessage,
                               String logMessage) {
            super(HttpStatus.FORBIDDEN, "CAPTCHA_REQUIRED", clientMessage, logMessage,
                    Map.of("captchaRequired", true,
                           "imageDataUri", imageDataUri,
                           "expiresInSeconds", expiresInSeconds));
        }
    }

    /** No live one-time code on this session — usually a stale tab or a restarted server. */
    public static class MfaNotPending extends ApiException {
        public MfaNotPending(String logMessage) {
            super(HttpStatus.UNAUTHORIZED, "MFA_NOT_PENDING",
                    "Your sign-in session has expired. Please sign in again.", logMessage);
        }
    }

    public static class MfaCodeExpired extends ApiException {
        public MfaCodeExpired(String logMessage) {
            super(HttpStatus.UNAUTHORIZED, "MFA_CODE_EXPIRED",
                    "That code has expired. Request a new one.", logMessage);
        }
    }

    public static class MfaCodeInvalid extends ApiException {
        public MfaCodeInvalid(String logMessage) {
            super(HttpStatus.UNAUTHORIZED, "MFA_CODE_INVALID",
                    "That code is not correct.", logMessage);
        }
    }

    /** Attempts exhausted; the challenge is destroyed and the RM starts over. */
    public static class MfaAttemptsExhausted extends ApiException {
        public MfaAttemptsExhausted(String logMessage) {
            super(HttpStatus.UNAUTHORIZED, "MFA_ATTEMPTS_EXHAUSTED",
                    "Too many incorrect codes. Please sign in again.", logMessage);
        }
    }

    public static class ResendTooSoon extends ApiException {
        public ResendTooSoon(long retryAfterSeconds, String logMessage) {
            super(HttpStatus.TOO_MANY_REQUESTS, "RESEND_TOO_SOON",
                    "Please wait before requesting another code.", logMessage,
                    Map.of("retryAfterSeconds", retryAfterSeconds));
        }
    }
}



package com.sc.wealthcore.exception;

import com.sc.wealthcore.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Owner: Rajnish. The single place an error becomes an HTTP response.
 *
 * <p>Controllers never build error bodies and never catch for the purpose of shaping one.
 * They throw; this decides the status, the code and the wording.
 *
 * <p>The rule that matters: <strong>a client only ever sees what an
 * {@link ApiException} explicitly marked safe.</strong> Anything else — a JPA failure, a
 * null dereference, a mail server timeout — is a bug, and becomes an opaque 500. Stack
 * traces, SQL and internal class names stay in the log, because error bodies are one of
 * the most reliable ways to hand an attacker a map of the system.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** Everything the API raises on purpose. */
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException ex, HttpServletRequest request) {
        // 4xx is the client's problem and expected traffic — logged at WARN without a
        // stack trace so a brute-force run cannot flood the log with noise. 5xx is ours.
        if (ex.getStatus().is5xxServerError()) {
            log.error("{} {} -> {} [{}]", request.getMethod(), request.getRequestURI(),
                    ex.getStatus().value(), ex.getCode(), ex);
        } else {
            log.warn("{} {} -> {} [{}]: {}", request.getMethod(), request.getRequestURI(),
                    ex.getStatus().value(), ex.getCode(), ex.getMessage());
        }

        ResponseEntity.BodyBuilder response = ResponseEntity.status(ex.getStatus());

        // Give a throttled caller the standard header as well as the JSON field.
        Object retryAfter = ex.getDetails() == null ? null : ex.getDetails().get("retryAfterSeconds");
        if (retryAfter != null) {
            response.header("Retry-After", String.valueOf(retryAfter));
        }

        return response.body(ErrorResponse.of(ex.getCode(), ex.getClientMessage(), ex.getDetails()));
    }

    /** Bean-validation failures on a @Valid request body. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, Object> fields = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fields.putIfAbsent(error.getField(), error.getDefaultMessage());
        }

        log.warn("Validation failed: {}", fields);

        return ResponseEntity.badRequest()
                .body(ErrorResponse.of("VALIDATION_FAILED", "Please check the highlighted fields.", fields));
    }

    /** Malformed JSON. The parser message can quote the payload, so it is not echoed. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadable(HttpMessageNotReadableException ex) {
        log.warn("Unreadable request body: {}", ex.getMessage());
        return ResponseEntity.badRequest()
                .body(ErrorResponse.of("MALFORMED_REQUEST", "The request could not be read."));
    }

    /**
     * The catch-all. Deliberately says nothing: if this fires, we have a bug, and the
     * details belong in the log where only we can read them.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception on {} {}", request.getMethod(), request.getRequestURI(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ErrorResponse.of("INTERNAL_ERROR", "Something went wrong. Please try again."));
    }
}



