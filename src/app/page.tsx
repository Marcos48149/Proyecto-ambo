'use client';

import { ProductCard } from '@/components/ProductCard';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { UserNav } from '@/components/UserNav';

export default function HomePage() {
  const firestore = useFirestore();
  const productsQuery = query(collection(firestore, 'products'));
  const { data: products, isLoading } = useCollection<Product>(
    productsQuery as any
  );

  const featuredProducts = products?.slice(0, 5) || [];

  return (
    <div className="bg-background text-foreground">
      {/* Main Navigation */}
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            <span className="font-bold text-lg">Ambos Web</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Link href="/" className="transition-colors hover:text-primary">
              Inicio
            </Link>
            <Link
              href="#"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Catálogo
            </Link>
            <Link
              href="/dashboard"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Admin
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <UserNav />
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative h-[60vh] w-full">
          <Image
            src="https://picsum.photos/seed/hero/1200/800"
            alt="Profesionales médicos con uniformes"
            fill
            className="brightness-50 object-cover"
            data-ai-hint="medical professionals scrubs"
            priority
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-primary-foreground">
            <h1 className="text-4xl font-bold md:text-6xl">
              Estilo y Confort para Profesionales
            </h1>
            <p className="mt-4 max-w-2xl text-lg">
              Descubre nuestra colección de ambos y uniformes médicos diseñados
              para tu día a día.
            </p>
            <Button size="lg" className="mt-8">
              Explorar Colección
            </Button>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              Productos Destacados
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
              Una selección de nuestros ambos más populares y mejor valorados.
            </p>
            <div className="mt-12">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-4">
                      <Skeleton className="h-[400px] w-full" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-8 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <Carousel
                  opts={{
                    align: 'start',
                    loop: true,
                  }}
                  className="w-full"
                >
                  <CarouselContent>
                    {featuredProducts.map((product) => (
                      <CarouselItem
                        key={product.id}
                        className="md:basis-1/2 lg:basis-1/3"
                      >
                        <div className="p-1">
                          <ProductCard product={product} />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="ml-12" />
                  <CarouselNext className="mr-12" />
                </Carousel>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/20">
        <div className="container mx-auto py-8 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Ambos Web. Todos los derechos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
