package com.example.PMS.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.PMS.Entity.Application;
import com.example.PMS.Entity.ApplicationStatus;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    // ✅ THIS PREVENTS DUPLICATES
    boolean existsByStudentStudentIdAndJobJobId(Long studentId, Long jobId);

    List<Application> findByStudentStudentIdOrderByAppliedDateDesc(Long studentId);

    long countByStatus(ApplicationStatus status);

    @Query("SELECT a.job.title, COUNT(a) FROM Application a GROUP BY a.job.title ORDER BY COUNT(a) DESC")
    List<Object[]> countApplicationsByJobTitle();

    @Query("SELECT a.student.dept, COUNT(a) FROM Application a WHERE a.status = com.example.PMS.Entity.ApplicationStatus.SELECTED GROUP BY a.student.dept")
    List<Object[]> countSelectedByDepartment();
}
