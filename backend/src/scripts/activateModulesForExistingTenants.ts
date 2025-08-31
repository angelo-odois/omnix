/**
 * Script para ativar módulos para tenants existentes
 * Execute: npx tsx src/scripts/activateModulesForExistingTenants.ts
 */

import authServiceV2 from '../services/authServiceV2';
import prisma from '../lib/database';
import { moduleService } from '../services/moduleService';
import { SYSTEM_MODULES } from '../types/modules';

async function activateModulesForExistingTenants() {
  console.log('🔧 Ativando módulos para tenants existentes...\n');
  
  try {
    // Buscar todos os tenants da database
    const tenants = await prisma.tenant.findMany();
    
    console.log(`📋 Encontrados ${tenants.length} tenants:`);
    tenants.forEach(tenant => {
      console.log(`  - ${tenant.name} (${tenant.id})`);
    });
    console.log('');

    // Ativar módulos básicos para cada tenant
    const basicModules = [
      SYSTEM_MODULES.MESSAGES,
      SYSTEM_MODULES.CONTACTS,
      SYSTEM_MODULES.WHATSAPP,
      SYSTEM_MODULES.WORKFLOWS
    ];

    for (const tenant of tenants) {
      console.log(`🔧 Configurando módulos para: ${tenant.name}`);
      
      for (const moduleId of basicModules) {
        try {
          const config = {
            maxInstances: moduleId === SYSTEM_MODULES.WHATSAPP ? 2 : undefined,
            maxRequests: 10000,
            customLimits: moduleId === SYSTEM_MODULES.WORKFLOWS ? { maxWorkflows: 5 } : undefined
          };

          await moduleService.enableModuleForTenant(
            tenant.id,
            moduleId,
            config,
            'system-script'
          );
          
          console.log(`  ✅ ${moduleId} ativado`);
        } catch (error: any) {
          console.log(`  ❌ ${moduleId} falhou: ${error.message}`);
        }
      }
      console.log('');
    }

    // Mostrar status final
    console.log('📊 Status final dos módulos por tenant:');
    for (const tenant of tenants) {
      const tenantModules = await moduleService.getTenantModules(tenant.id);
      console.log(`\n${tenant.name}:`);
      tenantModules.forEach(tm => {
        console.log(`  - ${tm.moduleId}: ${tm.isEnabled ? '✅ Ativo' : '❌ Inativo'}`);
      });
    }

    console.log('\n✅ Script executado com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao executar script:', error);
  }
}

activateModulesForExistingTenants();