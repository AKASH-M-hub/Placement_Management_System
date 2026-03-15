package com.example.PMS.Repository;

import com.example.PMS.Entity.Offer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OfferRepository extends JpaRepository<Offer, Long> {
    List<Offer> findByApplicationStudentStudentIdOrderByOfferedDateDesc(Long studentId);
}
