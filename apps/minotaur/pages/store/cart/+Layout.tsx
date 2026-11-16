import { CartNavigation } from "@/shared/components/app/shop/components/cart/cart-navigation";
import { WalletStrip } from "@/shared/components/app/wallet/components/wallet-strip";
import { type PropsWithChildren } from "react";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="flex flex-col w-full gap-6">
      <CartNavigation />
      <WalletStrip />
      {children}
    </div>
  )
}