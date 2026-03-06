import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleUseCases } from '../../../domain/usecases/role.usecases';
import { Role } from '../../../core/models/role.model';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss']
})

export class RolesComponent implements OnInit {
  roles: Role[] = [];
  isLoading = true;
  isEditing = false;
  editingRole: Partial<Role> = {};
  showModal = false;
  errorMessage = '';

  constructor(private roleUseCases: RoleUseCases) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.isLoading = true;
    
    this.roleUseCases.getAllRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        this.isLoading = false;},
      error: (error) => {
        console.error('Error loading roles:', error);
        this.isLoading = false;}});
  }

  openAddModal(): void {
    this.isEditing = false;
    this.editingRole = { name: '', code: '', isActive: true };
    this.showModal = true;
    this.errorMessage = '';
  }

  openEditModal(role: Role): void {
    this.isEditing = true;
    this.editingRole = { ...role };
    this.showModal = true;
    this.errorMessage = '';
  }

  closeModal(): void {
    this.showModal = false;
    this.editingRole = {};
    this.errorMessage = '';
  }

  saveRole(): void {
    if (!this.editingRole.name || !this.editingRole.code) {
      this.errorMessage = 'Nombre y código son requeridos';
      
      return;
    }
    
    if (this.isEditing && this.editingRole.id) {
      this.roleUseCases.updateRole(this.editingRole.id, this.editingRole).subscribe({
        next: () => {
          this.loadRoles();
          this.closeModal();},
        error: (error) => {
          console.error('Error updating role:', error);
          this.errorMessage = 'Error al actualizar el rol';}});
    } else {
      this.roleUseCases.createRole(this.editingRole).subscribe({
        next: () => {
          this.loadRoles();
          this.closeModal();},
        error: (error) => {
          console.error('Error creating role:', error);
          this.errorMessage = 'Error al crear el rol';}});
    }
  }

  deleteRole(role: Role): void {
    if (confirm(`¿Estás seguro de que deseas eliminar el rol "${role.name}"?`)) {
      this.roleUseCases.deleteRole(role.id).subscribe({
        next: () => {
          this.loadRoles();},
        error: (error) => {
          console.error('Error deleting role:', error);
          alert('Error al eliminar el rol');}});
    }
  }

  toggleStatus(role: Role): void {
    const action = role.isActive 
      ? this.roleUseCases.deactivateRole(role.id) 
      : this.roleUseCases.activateRole(role.id);

    action.subscribe({
      next: () => {
        this.loadRoles();},
      error: (error) => {
        console.error('Error toggling role status:', error);}});
  }
}
