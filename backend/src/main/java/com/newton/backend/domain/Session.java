package com.newton.backend.domain;

import jakarta.persistence.*;
import lombok.*;


import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session {

    @Id
    @Column(name = "id", updatable = false, nullable = false)
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "location", nullable = false)
    private String location;

    @Column(name = "notes")
    private String notes;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private SessionStatusEnum status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "host_id")
    private User host;

    // players in session
    @Builder.Default
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true,fetch = FetchType.LAZY)
    private List<SessionPlayer> playersInSession = new ArrayList<>();

    // player invites
    @Builder.Default
    @OneToMany(mappedBy = "session",  cascade = CascadeType.ALL, orphanRemoval = true,fetch = FetchType.LAZY)
    private List<SessionInvite> invites = new ArrayList<>();

    // buy ins
    @Builder.Default
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true,fetch = FetchType.LAZY)
    private List<BuyIn> buyIns = new ArrayList<>();

    // cash out's
    @Builder.Default
    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true,fetch = FetchType.LAZY)
    private List<CashOut> cashOuts = new ArrayList<>();

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;

        Session session = (Session) o;
        return Objects.equals(id, session.id) && Objects.equals(name, session.name) && Objects.equals(startTime, session.startTime) && Objects.equals(endTime, session.endTime) && Objects.equals(location, session.location) && Objects.equals(notes, session.notes) && status == session.status && Objects.equals(host, session.host);
    }

    @Override
    public int hashCode() {
        int result = Objects.hashCode(id);
        result = 31 * result + Objects.hashCode(name);
        result = 31 * result + Objects.hashCode(startTime);
        result = 31 * result + Objects.hashCode(endTime);
        result = 31 * result + Objects.hashCode(location);
        result = 31 * result + Objects.hashCode(notes);
        result = 31 * result + Objects.hashCode(status);
        result = 31 * result + Objects.hashCode(host);
        return result;
    }
}
