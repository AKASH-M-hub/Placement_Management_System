package com.example.PMS.Service;

import com.example.PMS.DTO.IssueOfferRequest;
import com.example.PMS.DTO.OfferResponseRequest;
import com.example.PMS.Entity.*;
import com.example.PMS.Repository.ApplicationRepository;
import com.example.PMS.Repository.OfferRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class OfferService {

    private final OfferRepository offerRepository;
    private final ApplicationRepository applicationRepository;

    public OfferService(OfferRepository offerRepository,
                        ApplicationRepository applicationRepository) {
        this.offerRepository = offerRepository;
        this.applicationRepository = applicationRepository;
    }

    public Offer issueOffer(Long applicationId, IssueOfferRequest request) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        application.setStatus(ApplicationStatus.OFFERED);
        applicationRepository.save(application);

        Offer offer = new Offer();
        offer.setApplication(application);
        offer.setOfferedCtc(request.getOfferedCtc());
        offer.setRemarks(request.getRemarks());
        offer.setOfferedDate(LocalDate.now());
        offer.setStatus(OfferStatus.ISSUED);

        return offerRepository.save(offer);
    }

    public Offer respondToOffer(Long offerId, OfferResponseRequest request) {
        Offer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new IllegalArgumentException("Offer not found"));

        offer.setStatus(request.isAccepted() ? OfferStatus.ACCEPTED : OfferStatus.REJECTED);
        offer.setResponseDate(LocalDate.now());
        offer.setRemarks(request.getRemarks());

        Application application = offer.getApplication();
        application.setStatus(request.isAccepted() ? ApplicationStatus.SELECTED : ApplicationStatus.REJECTED);
        applicationRepository.save(application);

        return offerRepository.save(offer);
    }

    public List<Offer> getAllOffers() {
        return offerRepository.findAll();
    }

    public List<Offer> getStudentOffers(Long studentId) {
        return offerRepository.findByApplicationStudentStudentIdOrderByOfferedDateDesc(studentId);
    }
}
