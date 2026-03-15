package com.example.PMS.Repository;

import com.example.PMS.Entity.Interview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InterviewRepository extends JpaRepository<Interview, Long> {
    List<Interview> findByApplicationStudentStudentIdOrderByScheduledAtAsc(Long studentId);
}
