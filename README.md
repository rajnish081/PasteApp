package com.sc.wealthcore.repository;

import com.sc.wealthcore.entity.LoginAttempt;
import java.time.Instant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {

    /**
     * Failed attempts against this username since the given instant. SUCCESS rows are
     * excluded so a correct sign-in naturally clears the counter without a delete.
     */
    @Query("""
           SELECT COUNT(a) FROM LoginAttempt a
           WHERE LOWER(a.usernameAttempted) = LOWER(:username)
             AND a.outcome <> 'SUCCESS'
             AND a.attemptedAt >= :since
           """)
    long countRecentFailuresByUsername(@Param("username") String username,
                                       @Param("since") Instant since);

    /**
     * Same count keyed on the caller's address, so spraying many different usernames
     * from one host trips the gate too — a per-username counter alone would never fire.
     */
    @Query("""
           SELECT COUNT(a) FROM LoginAttempt a
           WHERE a.ipAddress = :ip
             AND a.outcome <> 'SUCCESS'
             AND a.attemptedAt >= :since
           """)
    long countRecentFailuresByIp(@Param("ip") String ip, @Param("since") Instant since);

    /** Housekeeping for the audit table; called by a scheduled sweep. */
    @Modifying
    @Query("DELETE FROM LoginAttempt a WHERE a.attemptedAt < :before")
    int deleteOlderThan(@Param("before") Instant before);
}







package com.sc.wealthcore.repository;

import com.sc.wealthcore.entity.RelationshipManager;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface RelationshipManagerRepository extends JpaRepository<RelationshipManager, String> {

    /**
     * Case-insensitive, matching the unique index in V1__auth_schema.sql. Signing in as
     * "rm001" must find "RM001" — an RM should not be locked out by their caps lock.
     */
    @Query("SELECT rm FROM RelationshipManager rm WHERE LOWER(rm.username) = LOWER(:username)")
    Optional<RelationshipManager> findByUsernameIgnoreCase(@Param("username") String username);
}
