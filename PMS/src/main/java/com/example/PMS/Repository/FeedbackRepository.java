package com.example.PMS.Repository;

import com.example.PMS.Entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByApplicationStudentStudentIdOrderByCreatedAtDesc(Long studentId);
}
