package com.example.PMS.Security;

import com.example.PMS.Entity.Admin;
import com.example.PMS.Entity.Student;
import com.example.PMS.Repository.AdminRepository;
import com.example.PMS.Repository.StudentRepository;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final StudentRepository studentRepo;
    private final AdminRepository adminRepo;

    public CustomUserDetailsService(StudentRepository studentRepo,
                                    AdminRepository adminRepo) {
        this.studentRepo = studentRepo;
        this.adminRepo = adminRepo;
    }

    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        // Check Admin
        Admin admin = adminRepo.findByEmail(email).orElse(null);
        if (admin != null) {
            return new User(
                admin.getEmail(),
                admin.getPassword(),
                List.of(new SimpleGrantedAuthority(admin.getRole()))
            );
        }

        // Check Student
        Student student = studentRepo.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return new User(
            student.getEmail(),
            student.getPassword(),
            List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))
        );
    }
}
