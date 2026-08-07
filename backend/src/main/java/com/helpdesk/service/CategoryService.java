package com.helpdesk.service;

import com.helpdesk.dto.CategoryRequest;
import com.helpdesk.entity.Category;
import com.helpdesk.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public Category create(CategoryRequest request) {
        if (categoryRepository.existsByName(request.getName()))
            throw new RuntimeException("Catégorie déjà existante : " + request.getName());
        Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .color(request.getColor())
                .active(true)
                .build();
        return categoryRepository.save(category);
    }

    public List<Category> getAll() {
        return categoryRepository.findAll();
    }

    public List<Category> getActive() {
        return categoryRepository.findByActiveTrue();
    }

    public Category update(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setColor(request.getColor());
        return categoryRepository.save(category);
    }

    public String toggle(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));
        category.setActive(!category.isActive());
        categoryRepository.save(category);
        return category.isActive() ? "Catégorie activée" : "Catégorie désactivée";
    }

    public String delete(Long id) {
        if (!categoryRepository.existsById(id))
            throw new RuntimeException("Catégorie introuvable");
        categoryRepository.deleteById(id);
        return "Catégorie supprimée";
    }
    public Category getById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Catégorie introuvable"));
    }

}