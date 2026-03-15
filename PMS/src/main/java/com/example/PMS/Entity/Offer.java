package com.example.PMS.Entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "offer_record")
public class Offer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long offerId;

    @ManyToOne
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    private Double offeredCtc;
    private LocalDate offeredDate;
    private LocalDate responseDate;

    @Enumerated(EnumType.STRING)
    private OfferStatus status;

    @Column(length = 500)
    private String remarks;

    public Long getOfferId() {
        return offerId;
    }

    public void setOfferId(Long offerId) {
        this.offerId = offerId;
    }

    public Application getApplication() {
        return application;
    }

    public void setApplication(Application application) {
        this.application = application;
    }

    public Double getOfferedCtc() {
        return offeredCtc;
    }

    public void setOfferedCtc(Double offeredCtc) {
        this.offeredCtc = offeredCtc;
    }

    public LocalDate getOfferedDate() {
        return offeredDate;
    }

    public void setOfferedDate(LocalDate offeredDate) {
        this.offeredDate = offeredDate;
    }

    public LocalDate getResponseDate() {
        return responseDate;
    }

    public void setResponseDate(LocalDate responseDate) {
        this.responseDate = responseDate;
    }

    public OfferStatus getStatus() {
        return status;
    }

    public void setStatus(OfferStatus status) {
        this.status = status;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }
}
