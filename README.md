package com.sc.wealthcore.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.Map;

/**
 * Owner: Rajnish. The single error shape every endpoint returns, produced only by
 * {@code GlobalExceptionHandler}.
 *
 * <p>{@code code} is a stable machine-readable token the SPA switches on;
 * {@code message} is human-readable and safe to display. Neither ever carries a stack
 * trace, a SQL fragment or an internal class name — those go to the log.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        String code,
        String message,
        Instant timestamp,
        Map<String, Object> details
) {

    public static ErrorResponse of(String code, String message) {
        return new ErrorResponse(code, message, Instant.now(), null);
    }

    public static ErrorResponse of(String code, String message, Map<String, Object> details) {
        return new ErrorResponse(code, message, Instant.now(), details);
    }
}



package com.sc.wealthcore.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Owner: Rajnish — US03.
 *
 * <p>{@code captchaAnswer} is null on a first attempt and only supplied once the server
 * has said a CAPTCHA is required, which is why it is not annotated {@code @NotBlank} —
 * whether it is needed is a runtime decision, not a shape decision.
 */
public record LoginRequest(

        @NotBlank(message = "User ID is required")
        @Size(max = 64)
        String username,

        @NotBlank(message = "Password is required")
        @Size(max = 200)
        String password,

        @Size(max = 16)
        String captchaAnswer
) {}




package com.sc.wealthcore.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Owner: Rajnish — US03. The 200 response to POST /auth/login.
 *
 * <p>Reaching this response means the password was correct, but the caller is
 * <em>not</em> authenticated yet: no SecurityContext is set until the one-time code is
 * verified. The profile stays null until then, so a half-finished sign-in reveals
 * nothing about the RM beyond a masked email.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record LoginResponse(
        boolean mfaRequired,
        String maskedEmail,
        Integer resendCooldownSeconds,
        RmProfile profile
) {

    /** Password accepted, code emailed, second factor outstanding. */
    public static LoginResponse mfaChallenge(String maskedEmail, int resendCooldownSeconds) {
        return new LoginResponse(true, maskedEmail, resendCooldownSeconds, null);
    }

    /** Signed in — only reachable when MFA is disabled for this RM. */
    public static LoginResponse signedIn(RmProfile profile) {
        return new LoginResponse(false, null, null, profile);
    }
}



package com.sc.wealthcore.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record MfaVerifyRequest(

        @NotBlank(message = "Code is required")
        @Pattern(regexp = "\\d{4,10}", message = "Code must be digits only")
        String code
) {}

package com.sc.wealthcore.dto;

import com.sc.wealthcore.entity.RelationshipManager;

/**
 * Owner: Rajnish — US03. What the API returns for a signed-in RM.
 *
 * <p>Field names match {@code currentRm} in frontend/src/services/mockData.js exactly, per
 * the README's contract rule. Deliberately built by hand from the entity rather than
 * serialising it: the password hash cannot appear here because there is nowhere to put it.
 */
public record RmProfile(
        String id,
        String name,
        String initials,
        String email,
        String branch
) {
    public static RmProfile from(RelationshipManager rm) {
        return new RmProfile(rm.getId(), rm.getName(), rm.getInitials(), rm.getEmail(), rm.getBranch());
    }
}
