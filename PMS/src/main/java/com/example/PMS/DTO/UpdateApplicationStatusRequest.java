package com.example.PMS.DTO;

import com.example.PMS.Entity.ApplicationStatus;

public class UpdateApplicationStatusRequest {
    private ApplicationStatus status;
    private String remarks;

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
