import React, { useState } from "react"
import { Link } from "react-router-dom"
import { PageHeader } from "@/components/common/PageHeader"
import { Search, Filter, ShoppingCart, Star, Eye, Laptop, Headphones, Armchair, Footprints } from "lucide-react"

export function Catalog() {
  const [search, setSearch] = useState("")

  const products = [
    { id: "PROD-001", storeId: "store-001", name: "Laptop Gamer Ultra 16GB", price: 1299.99, storeName: "Tienda Tech Central", rating: 4.8, category: "Electrónica", icon: Laptop },
    { id: "PROD-002", storeId: "store-001", name: "Audífonos Bluetooth Noise Cancelling", price: 129.99, storeName: "Tienda Tech Central", rating: 4.9, category: "Electrónica", icon: Headphones },
    { id: "PROD-003", storeId: "store-002", name: "Silla Ergonómica de Oficina", price: 249.50, storeName: "Hogar & Confort", rating: 4.6, category: "Hogar", icon: Armchair },
    { id: "PROD-004", storeId: "store-003", name: "Zapatillas Deportivas Air Run", price: 89.90, storeName: "Sporting Goods", rating: 4.7, category: "Deportes", icon: Footprints },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catálogo de Productos"
        description="Explora productos comercializados por nuestras tiendas asociadas"
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos por nombre, marca o categoría..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-xs font-semibold text-foreground hover:bg-muted transition-colors w-full sm:w-auto justify-center">
          <Filter className="h-4 w-4 text-muted-foreground" /> Filtros
        </button>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((p) => {
          const IconComp = p.icon
          return (
            <div
              key={`${p.storeId}-${p.id}`}
              className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="h-48 bg-muted/60 relative flex items-center justify-center p-4">
                  <div className="h-20 w-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-lg group-hover:scale-110 transition-transform shadow-xs">
                    <IconComp className="h-10 w-10" />
                  </div>
                  <span className="absolute top-3 left-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-xs border border-border text-foreground">
                    {p.category}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <p className="text-[11px] font-medium text-muted-foreground">{p.storeName}</p>
                  <h3 className="font-bold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {p.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
                    <Star className="h-3.5 w-3.5 fill-amber-500" />
                    <span>{p.rating}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-border/50 mt-2">
                <div>
                  <span className="text-xs text-muted-foreground block">Precio</span>
                  <span className="text-lg font-extrabold text-foreground">${p.price.toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Link
                    to={`/catalogo/${p.storeId}/${p.id}`}
                    className="p-2 rounded-xl border border-border hover:bg-muted text-foreground transition-colors"
                    title="Ver detalle"
                  >
                    <Eye className="h-4 w-4" />
                  </Link>
                  <button
                    className="p-2 rounded-xl bg-accent text-accent-foreground font-semibold shadow-sm hover:opacity-90 transition-opacity"
                    title="Agregar al carrito"
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
