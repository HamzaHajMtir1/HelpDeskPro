package com.helpdesk.repository;

import com.helpdesk.entity.AccountRequest;
import com.helpdesk.entity.RequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountRequestRepository extends JpaRepository<AccountRequest, Long> {
    List<AccountRequest> findByStatus(RequestStatus status);

    // Vérifier si un email a déjà une demande PENDING
    boolean existsByEmailAndStatus(String email, RequestStatus status);

    // Vérifier si un email existe déjà (toute demande confondue)
    boolean existsByEmail(String email);
}