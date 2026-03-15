package com.example.PMS.Service;

import com.example.PMS.Entity.ApplicationStatus;
import com.example.PMS.Repository.ApplicationRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class AnalyticsService {

    private final ApplicationRepository applicationRepository;

    public AnalyticsService(ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
    }

    public Map<String, Object> getSummary() {
        Map<String, Object> summary = new HashMap<>();
        long total = applicationRepository.count();
        long selected = applicationRepository.countByStatus(ApplicationStatus.SELECTED);
        long rejected = applicationRepository.countByStatus(ApplicationStatus.REJECTED);
        long offered = applicationRepository.countByStatus(ApplicationStatus.OFFERED);

        summary.put("totalApplications", total);
        summary.put("selected", selected);
        summary.put("rejected", rejected);
        summary.put("offered", offered);
        summary.put("selectionRate", total == 0 ? 0 : (selected * 100.0) / total);
        summary.put("applicationsByJob", applicationRepository.countApplicationsByJobTitle());
        summary.put("selectedByDepartment", applicationRepository.countSelectedByDepartment());
        return summary;
    }
}
