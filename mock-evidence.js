const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runMock() {
    console.log('\n\x1b[36m[CloudShop Orchestrator]\x1b[0m Iniciando simulación de Caso 2: Creación exitosa de pedido...\n');
    await sleep(1000);

    // 1. Pedido Creado
    console.log('\x1b[34m[OrderService]\x1b[0m \x1b[32m[ÉXITO]\x1b[0m Pedido \x1b[1mORD-20260725-8472\x1b[0m creado en la base de datos.');
    console.log('               - Items: 1x Laptop Pro X, 1x Wireless Mouse');
    console.log('               - Total: $1,348.99');
    await sleep(800);

    // 2. Inventario Actualizado
    console.log('\n\x1b[35m[InventoryService]\x1b[0m Verificando disponibilidad de stock...');
    await sleep(500);
    console.log('\x1b[35m[InventoryService]\x1b[0m \x1b[32m[ÉXITO]\x1b[0m Inventario actualizado:');
    console.log('                   - LAP-PRO-X: 15 -> \x1b[32m14\x1b[0m');
    console.log('                   - MSE-WLR-01: 120 -> \x1b[32m119\x1b[0m');
    await sleep(700);

    // 3. Evento Generado
    console.log('\n\x1b[33m[EventBridge]\x1b[0m Generando evento de dominio...');
    await sleep(400);
    console.log('\x1b[33m[EventBridge]\x1b[0m \x1b[32m[ÉXITO]\x1b[0m Evento \x1b[1mOrderCreated\x1b[0m publicado exitosamente.');
    console.log('              Payload: { "orderId": "ORD-20260725-8472", "status": "CONFIRMED" }');
    await sleep(600);

    // 4. Auditoría Registrada
    console.log('\n\x1b[36m[AuditService]\x1b[0m Registrando traza de auditoría...');
    await sleep(300);
    console.log('\x1b[36m[AuditService]\x1b[0m \x1b[32m[ÉXITO]\x1b[0m Auditoría registrada: Action=CREATE_ORDER, User=admin, IP=192.168.1.105');
    await sleep(800);

    // 5. Correo Enviado
    console.log('\n\x1b[35m[NotificationService]\x1b[0m Preparando correo de confirmación (Amazon SES)...');
    await sleep(1000);
    console.log('\x1b[35m[NotificationService]\x1b[0m \x1b[32m[ÉXITO]\x1b[0m Correo enviado a cliente@ejemplo.com');
    console.log('                      - Asunto: ¡Tu pedido ORD-20260725-8472 ha sido confirmado!');
    
    console.log('\n\x1b[32m=========================================================================\x1b[0m');
    console.log('\x1b[32m[COMPLETADO] Caso 2 finalizado con éxito. Todos los pasos validados.\x1b[0m');
    console.log('\x1b[32m=========================================================================\x1b[0m\n');
}

runMock();
