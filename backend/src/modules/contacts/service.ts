import prisma from '../../lib/database';
import { moduleService } from '../../services/moduleService';
import { SYSTEM_MODULES } from '../../types/modules';

export interface ContactData {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  avatar?: string;
  tags: string[];
  customFields: Record<string, any>;
  groups: string[];
  isBlocked: boolean;
  lastContact?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContactRequest {
  name: string;
  phone: string;
  email?: string;
  tags?: string[];
  customFields?: Record<string, any>;
  groups?: string[];
}

class ContactService {
  
  async getContacts(tenantId: string, filters?: {
    search?: string;
    tags?: string[];
    groups?: string[];
    limit?: number;
    offset?: number;
  }): Promise<ContactData[]> {
    // Check module access
    const tenantModules = await moduleService.getTenantModules(tenantId);
    const contactsModule = tenantModules.find(m => m.moduleId === SYSTEM_MODULES.CONTACTS && m.isActive);
    if (!contactsModule) {
      throw new Error('Módulo Contacts não está ativo para este tenant');
    }

    const where: any = { tenantId };
    
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters?.groups && filters.groups.length > 0) {
      where.groups = { hasSome: filters.groups };
    }

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { name: 'asc' },
      take: filters?.limit || 100,
      skip: filters?.offset || 0
    });

    return contacts.map(contact => ({
      id: contact.id,
      tenantId: contact.tenantId,
      name: contact.name,
      phone: contact.phone,
      email: contact.email || undefined,
      avatar: contact.avatar || undefined,
      tags: contact.tags,
      customFields: (contact.customFields as any) || {},
      groups: contact.groups,
      isBlocked: contact.isBlocked,
      lastContact: contact.lastContact || undefined,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt
    }));
  }

  async getContactByPhone(tenantId: string, phone: string): Promise<ContactData | null> {
    // Normalize phone number
    const normalizedPhone = this.normalizePhoneNumber(phone);
    
    const contact = await prisma.contact.findFirst({
      where: {
        tenantId,
        phone: normalizedPhone
      }
    });

    if (!contact) return null;

    return {
      id: contact.id,
      tenantId: contact.tenantId,
      name: contact.name,
      phone: contact.phone,
      email: contact.email || undefined,
      avatar: contact.avatar || undefined,
      tags: contact.tags,
      customFields: (contact.customFields as any) || {},
      groups: contact.groups,
      isBlocked: contact.isBlocked,
      lastContact: contact.lastContact || undefined,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt
    };
  }

  async createContact(tenantId: string, data: CreateContactRequest): Promise<ContactData> {
    // Check module access and limits
    const tenantModules = await moduleService.getTenantModules(tenantId);
    const contactsModule = tenantModules.find(m => m.moduleId === SYSTEM_MODULES.CONTACTS && m.isActive);
    if (!contactsModule) {
      throw new Error('Módulo Contacts não está ativo para este tenant');
    }

    // Normalize phone number
    const normalizedPhone = this.normalizePhoneNumber(data.phone);

    // Check if contact already exists
    const existingContact = await this.getContactByPhone(tenantId, normalizedPhone);
    if (existingContact) {
      throw new Error('Contato já existe com este número');
    }

    // Check limits
    const currentContacts = await prisma.contact.count({
      where: { tenantId }
    });

    const maxContacts = contactsModule.config?.customLimits?.maxContacts || 1000;
    if (currentContacts >= maxContacts) {
      throw new Error(`Limite de ${maxContacts} contatos atingido`);
    }

    const contact = await prisma.contact.create({
      data: {
        tenantId,
        name: data.name,
        phone: normalizedPhone,
        email: data.email,
        tags: data.tags || [],
        customFields: data.customFields || {},
        groups: data.groups || [],
        isBlocked: false
      }
    });

    // Track usage
    await moduleService.trackModuleUsage(tenantId, SYSTEM_MODULES.CONTACTS, 'request');

    return {
      id: contact.id,
      tenantId: contact.tenantId,
      name: contact.name,
      phone: contact.phone,
      email: contact.email || undefined,
      avatar: contact.avatar || undefined,
      tags: contact.tags,
      customFields: (contact.customFields as any) || {},
      groups: contact.groups,
      isBlocked: contact.isBlocked,
      lastContact: contact.lastContact || undefined,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt
    };
  }

  async updateContact(contactId: string, updates: Partial<CreateContactRequest>): Promise<ContactData> {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId }
    });

    if (!contact) {
      throw new Error('Contato não encontrado');
    }

    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.phone) updateData.phone = this.normalizePhoneNumber(updates.phone);
    if (updates.email) updateData.email = updates.email;
    if (updates.tags) updateData.tags = updates.tags;
    if (updates.customFields) updateData.customFields = updates.customFields;
    if (updates.groups) updateData.groups = updates.groups;

    const updatedContact = await prisma.contact.update({
      where: { id: contactId },
      data: updateData
    });

    return {
      id: updatedContact.id,
      tenantId: updatedContact.tenantId,
      name: updatedContact.name,
      phone: updatedContact.phone,
      email: updatedContact.email || undefined,
      avatar: updatedContact.avatar || undefined,
      tags: updatedContact.tags,
      customFields: (updatedContact.customFields as any) || {},
      groups: updatedContact.groups,
      isBlocked: updatedContact.isBlocked,
      lastContact: updatedContact.lastContact || undefined,
      createdAt: updatedContact.createdAt,
      updatedAt: updatedContact.updatedAt
    };
  }

  async findOrCreateContact(tenantId: string, phone: string, name?: string): Promise<ContactData> {
    const normalizedPhone = this.normalizePhoneNumber(phone);
    
    // Try to find existing contact
    let contact = await this.getContactByPhone(tenantId, normalizedPhone);
    
    if (!contact) {
      // Create new contact with detected name or phone as fallback
      const contactName = name || this.extractNameFromPhone(normalizedPhone) || normalizedPhone;
      
      contact = await this.createContact(tenantId, {
        name: contactName,
        phone: normalizedPhone
      });
      
      console.log(`✅ Novo contato criado: ${contactName} (${normalizedPhone})`);
    } else if (name && name !== contact.name && name !== normalizedPhone) {
      // Update contact name if we have a better name
      contact = await this.updateContact(contact.id, { name });
      console.log(`✅ Contato atualizado: ${contact.name} (${normalizedPhone})`);
    }

    return contact;
  }

  // Helper methods
  private normalizePhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Handle different formats
    if (cleaned.length === 11 && cleaned.startsWith('11')) {
      return `55${cleaned}`;
    } else if (cleaned.length === 11) {
      return `55${cleaned}`;
    } else if (cleaned.length === 13 && cleaned.startsWith('55')) {
      return cleaned;
    } else if (cleaned.includes('@c.us')) {
      return phone.replace('@c.us', '');
    }
    
    return cleaned;
  }

  private extractNameFromPhone(phone: string): string | null {
    // Extract area code and format for display
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 13 && cleaned.startsWith('55')) {
      const areaCode = cleaned.substring(2, 4);
      const number = cleaned.substring(4);
      return `Contato (${areaCode}) ${number.substring(0, 5)}-${number.substring(5)}`;
    }
    return null;
  }

  async syncContactsFromWhatsApp(tenantId: string, sessionName: string): Promise<number> {
    try {
      // This would integrate with WAHA to get contacts
      // For now, return 0 as placeholder
      console.log(`📞 Sincronização de contatos para ${sessionName} - Funcionalidade em desenvolvimento`);
      return 0;
    } catch (error) {
      console.error('Error syncing contacts from WhatsApp:', error);
      return 0;
    }
  }
}

export const contactService = new ContactService();
export default contactService;