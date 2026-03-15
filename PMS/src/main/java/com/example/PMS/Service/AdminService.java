package com.example.PMS.Service;

import com.example.PMS.Entity.Admin;
import com.example.PMS.Repository.AdminRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.Optional;

@Service
public class AdminService {

    private final AdminRepository repo;
    private final PasswordEncoder encoder;

    public AdminService(AdminRepository repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    public Admin registerAdmin(Admin admin) {
        // Check if email already exists
        if (repo.findByEmail(admin.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already registered");
        }
        
        admin.setPassword(encoder.encode(admin.getPassword()));
        String requestedRole = admin.getRole();
        if (requestedRole != null
                && requestedRole.toUpperCase(Locale.ROOT).contains("PLACEMENT_COORDINATOR")) {
            admin.setRole("ROLE_PLACEMENT_COORDINATOR");
        } else {
            admin.setRole("ROLE_ADMIN");
        }
        return repo.save(admin);
    }

    public Admin createAdmin(Admin admin) {
        return registerAdmin(admin);
    }

    public Optional<Admin> findByEmail(String email) {
        return repo.findByEmail(email);
    }
}
