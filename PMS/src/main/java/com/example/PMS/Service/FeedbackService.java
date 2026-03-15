package com.example.PMS.Service;

import com.example.PMS.DTO.SubmitFeedbackRequest;
import com.example.PMS.Entity.Application;
import com.example.PMS.Entity.Feedback;
import com.example.PMS.Repository.ApplicationRepository;
import com.example.PMS.Repository.FeedbackRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final ApplicationRepository applicationRepository;

    public FeedbackService(FeedbackRepository feedbackRepository,
                           ApplicationRepository applicationRepository) {
        this.feedbackRepository = feedbackRepository;
        this.applicationRepository = applicationRepository;
    }

    public Feedback submitFeedback(String authorRole, String authorEmail, SubmitFeedbackRequest request) {
        Application application = applicationRepository.findById(request.getApplicationId())
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));

        Feedback feedback = new Feedback();
        feedback.setApplication(application);
        feedback.setAuthorRole(authorRole);
        feedback.setAuthorEmail(authorEmail);
        feedback.setComment(request.getComment());
        feedback.setRating(request.getRating());
        feedback.setCreatedAt(LocalDateTime.now());

        return feedbackRepository.save(feedback);
    }

    public List<Feedback> getAllFeedback() {
        return feedbackRepository.findAll();
    }

    public List<Feedback> getStudentFeedback(Long studentId) {
        return feedbackRepository.findByApplicationStudentStudentIdOrderByCreatedAtDesc(studentId);
    }
}
