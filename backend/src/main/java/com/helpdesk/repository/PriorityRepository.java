package com.helpdesk.repository;

import com.helpdesk.entity.Priority;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PriorityRepository extends JpaRepository<Priority, Long> {
    List<Priority> findByActiveTrueOrderByLevelAsc();
    boolean existsByName(String name);
}