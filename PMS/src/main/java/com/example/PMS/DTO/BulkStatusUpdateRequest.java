package com.example.PMS.DTO;

import com.example.PMS.Entity.ApplicationStatus;

import java.util.List;

public class BulkStatusUpdateRequest {
    private List<Long> applicationIds;
    private ApplicationStatus status;
    private String remarks;

    public List<Long> getApplicationIds() {
        return applicationIds;
    }

    public void setApplicationIds(List<Long> applicationIds) {
        this.applicationIds = applicationIds;
    }

    public ApplicationStatus getStatus() {
        return status;
    }

    public void setStatus(ApplicationStatus status) {
        this.status = status;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
