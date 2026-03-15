package com.example.PMS.Service;

import com.example.PMS.Entity.Admin;
import com.example.PMS.Entity.Student;
import com.example.PMS.Security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;

@Service
public class AuthenticationService {

    private final StudentService studentService;
    private final AdminService adminService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthenticationService(StudentService studentService,
                                AdminService adminService,
                                PasswordEncoder passwordEncoder,
                                JwtUtil jwtUtil) {
        this.studentService = studentService;
        this.adminService = adminService;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public Map<String, String> authenticateStudent(String email, String password) {
        Optional<Student> studentOpt = studentService.findByEmail(email);
        
        if (studentOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid email or password for student account");
        }

        Student student = studentOpt.get();
        
        if (!passwordEncoder.matches(password, student.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password for student account");
        }

        String token = jwtUtil.generateToken(student.getEmail(), "ROLE_STUDENT");
        
        return Map.of(
            "token", token,
            "role", "STUDENT",
            "email", student.getEmail()
        );
    }

    public Map<String, String> authenticateAdmin(String email, String password) {
        Optional<Admin> adminOpt = adminService.findByEmail(email);
        
        if (adminOpt.isEmpty()) {
            throw new IllegalArgumentException("Invalid email or password for admin account");
        }

        Admin admin = adminOpt.get();
        
        if (!passwordEncoder.matches(password, admin.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password for admin account");
        }

        String token = jwtUtil.generateToken(admin.getEmail(), admin.getRole());
        String normalizedRole = admin.getRole() == null ? "ADMIN" : admin.getRole().replace("ROLE_", "");
        
        return Map.of(
            "token", token,
            "role", normalizedRole,
            "email", admin.getEmail()
        );
    }

    public Map<String, String> login(String email, String password) {
        // Try admin first
        try {
            return authenticateAdmin(email, password);
        } catch (IllegalArgumentException e) {
            // If admin authentication fails, try student
        }

        // Try student
        return authenticateStudent(email, password);
    }
}
