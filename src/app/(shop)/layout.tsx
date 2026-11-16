import { CartDrawer, ClosedBanner, Footer, Header, MobileCartBar } from "@/components/shop/chrome";
import { WhatsAppButton } from "@/components/shop/whatsapp";
import { getCatalog } from "@/lib/catalog";
import { ShopProvider } from "@/lib/shop";

// Menu availability and prices must always be current.
export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const catalog = await getCatalog();
  return (
    <ShopProvider catalog={catalog}>
      <ClosedBanner />
      <Header />
      <main>{children}</main>
      <Footer />
      <CartDrawer />
      <MobileCartBar />
      <WhatsAppButton />
    </ShopProvider>
  );
}
