package com.example.PMS.Service;

import com.example.PMS.Entity.Student;
import com.example.PMS.Repository.StudentRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class StudentService {

    private final StudentRepository repo;
    private final PasswordEncoder encoder;

    public StudentService(StudentRepository repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    public Student registerStudent(Student student) {
        // Check if email already exists
        if (repo.findByEmail(student.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }
        
        student.setPassword(encoder.encode(student.getPassword()));
        student.setRole("ROLE_STUDENT");
        return repo.save(student);
    }

    public Student addStudent(Student student) {
        return registerStudent(student);
    }

    public Optional<Student> findByEmail(String email) {
        return repo.findByEmail(email);
    }

    public List<Student> getAllStudents() {
        return repo.findAll();
    }

    public Student updateProfile(Student existingStudent,
                                 String name,
                                 String dept,
                                 Double cgpa,
                                 String skills,
                                 String portfolioUrl) {
        existingStudent.setName(name == null ? existingStudent.getName() : name);
        existingStudent.setDept(dept == null ? existingStudent.getDept() : dept);
        existingStudent.setCgpa(cgpa == null ? existingStudent.getCgpa() : cgpa);
        existingStudent.setSkills(skills == null ? existingStudent.getSkills() : skills);
        existingStudent.setPortfolioUrl(portfolioUrl == null ? existingStudent.getPortfolioUrl() : portfolioUrl);
        return repo.save(existingStudent);
    }

    public Map<String, Object> calculateProfileCompleteness(Student student) {
        int total = 5;
        int filled = 0;

        if (student.getDept() != null && !student.getDept().isBlank()) {
            filled++;
        }
        if (student.getSkills() != null && !student.getSkills().isBlank()) {
            filled++;
        }
        if (student.getCgpa() > 0) {
            filled++;
        }
        if (student.getResumePath() != null && !student.getResumePath().isBlank()) {
            filled++;
        }
        if (student.getPortfolioUrl() != null && !student.getPortfolioUrl().isBlank()) {
            filled++;
        }

        int percentage = (filled * 100) / total;
        Map<String, Object> data = new HashMap<>();
        data.put("filledFields", filled);
        data.put("totalFields", total);
        data.put("percentage", percentage);
        return data;
    }
}
