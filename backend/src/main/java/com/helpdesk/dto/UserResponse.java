package com.helpdesk.dto;
import com.helpdesk.entity.User;
import lombok.*;
import java.time.LocalDateTime;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    private String company;
    private String phone;
    private boolean enabled;
    private boolean mustChangePassword;
    private LocalDateTime createdAt;
    private SpecialtyInfo specialtyCategory;
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SpecialtyInfo {
        private Long id;
        private String name;
        private String color;
    }
    public static UserResponse fromUser(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .company(user.getCompany())
                .phone(user.getPhone())
                .enabled(user.isEnabled())
                .mustChangePassword(user.isMustChangePassword())
                .createdAt(user.getCreatedAt())
                .specialtyCategory(
                        user.getSpecialtyCategory() != null
                                ? SpecialtyInfo.builder()
                                .id(user.getSpecialtyCategory().getId())
                                .name(user.getSpecialtyCategory().getName())
                                .color(user.getSpecialtyCategory().getColor())
                                .build()
                                : null
                )
                .build();
    }
}
