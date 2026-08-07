import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Limpia en orden de dependencias para re-ejecutar de forma idempotente.
  await prisma.stockMovement.deleteMany()
  await prisma.product.deleteMany()
  await prisma.supplierProduct.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.category.deleteMany()

  // ── Categorías ──
  const [alimentos, higiene, juguetes, accesorios] = await Promise.all([
    prisma.category.create({ data: { name: 'Alimentos' } }),
    prisma.category.create({ data: { name: 'Higiene' } }),
    prisma.category.create({ data: { name: 'Juguetes' } }),
    prisma.category.create({ data: { name: 'Accesorios' } }),
  ])

  // ── Proveedores ──
  const [purina, mayorista, royal] = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'Purina Distribuidora',
        whatsappNumber: '+5491123456789',
        notes: 'Entrega los martes. Mínimo 10 bolsas.',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Mayorista Pet Shop',
        whatsappNumber: '+5491169876543',
        notes: 'Arena e higiene con descuento por volumen.',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Royal Canin Arg',
        whatsappNumber: '+5491145651212',
        notes: 'Solo productos Royal Canin.',
      },
    }),
  ])

  // ── Listados de productos de cada proveedor (SupplierProduct) ──
  await Promise.all([
    prisma.supplierProduct.create({ data: { supplierId: purina.id, name: 'Dog Chow Adulto 15kg', categoryId: alimentos.id } }),
    prisma.supplierProduct.create({ data: { supplierId: purina.id, name: 'Excellent Adulto x2', categoryId: alimentos.id } }),
    prisma.supplierProduct.create({ data: { supplierId: mayorista.id, name: 'Arena Sanitaria 10kg', categoryId: higiene.id } }),
    prisma.supplierProduct.create({ data: { supplierId: mayorista.id, name: 'Pipeta Frontline 4x', categoryId: higiene.id, notes: 'Caja de 6' } }),
    prisma.supplierProduct.create({ data: { supplierId: royal.id, name: 'Royal Canin Mini Adulto 2kg', categoryId: alimentos.id } }),
    prisma.supplierProduct.create({ data: { supplierId: mayorista.id, name: 'Shampoo Perro 500ml', categoryId: higiene.id } }),
    prisma.supplierProduct.create({ data: { supplierId: mayorista.id, name: 'Pelota de goma grande', categoryId: juguetes.id } }),
  ])

  // ── Productos de la tienda ──
  const [dogChow, excellent, arena, pipeta, royalMini, shampoo, juguete] = await Promise.all([
    prisma.product.create({ data: { name: 'Dog Chow Adulto 15kg', categoryId: alimentos.id, supplierId: purina.id, stock: 12, stockMin: 5, status: 'ACTIVE' } }),
    prisma.product.create({ data: { name: 'Excellent Adulto', categoryId: alimentos.id, supplierId: purina.id, stock: 3, stockMin: 10, status: 'ACTIVE' } }),
    prisma.product.create({ data: { name: 'Arena Sanitaria 10kg', categoryId: higiene.id, supplierId: mayorista.id, stock: 40, stockMin: 10, status: 'ACTIVE' } }),
    prisma.product.create({ data: { name: 'Pipeta Frontline 4x', categoryId: higiene.id, supplierId: mayorista.id, stock: 8, stockMin: 2, status: 'ACTIVE' } }),
    prisma.product.create({ data: { name: 'Shampoo Perro 500ml', categoryId: higiene.id, supplierId: mayorista.id, stock: 15, stockMin: 5, status: 'ACTIVE' } }),
    prisma.product.create({ data: { name: 'Royal Canin Mini Adulto', categoryId: alimentos.id, supplierId: royal.id, stock: 0, stockMin: 4, status: 'ACTIVE' } }),
    prisma.product.create({ data: { name: 'Pelota de goma grande', categoryId: juguetes.id, supplierId: null, stock: 25, stockMin: 5, status: 'ACTIVE' } }),
  ])

  // ── Movimientos (historial consistente con el stock actual) ──
  const now = new Date()
  const yesterday = new Date(now.getTime() - 86_400_000)
  const lastWeek = new Date(now.getTime() - 7 * 86_400_000)

  await prisma.stockMovement.createMany({
    data: [
      // Dog Chow: 0→20→32→24→12
      { productId: dogChow.id, type: 'BUY', quantity: 20, supplierId: purina.id, note: 'Compra semanal', createdAt: lastWeek },
      { productId: dogChow.id, type: 'BUY', quantity: 12, supplierId: purina.id, note: 'Reposición', createdAt: yesterday },
      { productId: dogChow.id, type: 'SALE', quantity: 8, note: 'Venta mostrador', createdAt: now },
      { productId: dogChow.id, type: 'SALE', quantity: 12, note: 'Venta mostrador', createdAt: now },
      // Excellent: 0→5→3
      { productId: extra.id, type: 'BUY', quantity: 5, supplierId: purina.id, note: 'Compra inicial', createdAt: lastWeek },
      { productId: extra.id, type: 'SALE', quantity: 2, note: 'Venta mostrador', createdAt: now },
      // Arena: 0→40
      { productId: arena.id, type: 'BUY', quantity: 40, supplierId: mayorista.id, note: 'Compra mensual', createdAt: lastWeek },
      // Pipeta: 0→10→8
      { productId: pipeta.id, type: 'BUY', quantity: 10, supplierId: mayorista.id, note: 'Pedido', createdAt: lastWeek },
      { productId: pipeta.id, type: 'SALE', quantity: 2, note: 'Venta mostrador', createdAt: now },
      // Shampoo: 0→15
      { productId: shampoo.id, type: 'BUY', quantity: 15, supplierId: mayorista.id, note: 'Compra inicial', createdAt: lastWeek },
      // Royal Canin: 0→6→0 (vencido)
      { productId: royalMini.id, type: 'BUY', quantity: 6, supplierId: royal.id, note: 'Pedido inicial', createdAt: yesterday },
      { productId: royalMini.id, type: 'EXPIRY', quantity: 6, note: 'Producto vencido', createdAt: now },
      // Juguete: 0→25
      { productId: juguete.id, type: 'BUY', quantity: 25, supplierId: mayorista.id, note: 'Compra inicial', createdAt: lastWeek },
    ],
  })

  console.log('Seed completado')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())