import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { CartButton } from "@/components/CartButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/hooks/use-auth";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const topNavItems = [
  { to: "/products" as const, label: "Shop" },
  { to: "/vendors" as const, label: "Vendors" },
];

const exploreItems = [
  { to: "/memes" as const, label: "Memes" },
  { to: "/videos" as const, label: "Videos" },
  { to: "/charts" as const, label: "Charts" },
  { to: "/articles" as const, label: "Articles & References" },
  { to: "/recipes" as const, label: "Recipes" },
  { to: "/natural-remedies" as const, label: "Natural Remedies" },
  { to: "/studies" as const, label: "Studies" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const { user, role, loading, signOut } = useAuth();
  const router = useRouter();

  const handleBecomeVendor = () => {
    window.location.href = "/signup?role=vendor";
  };

  const handleSignOut = async () => {
    await signOut();
    router.navigate({ to: "/" });
  };

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [router.state.location.pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <img src="/logo.png" alt="Lifestyle Medicine Gateway" className="h-10 w-auto" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                Explore <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {exploreItems.map((item) => (
                <DropdownMenuItem key={item.label} asChild>
                  <Link to={item.to} className="w-full cursor-pointer hover:bg-accent focus:bg-accent outline-none block px-3 py-2 rounded-sm outline-none w-full">
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {topNavItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground [&.active]:bg-accent/50"
              activeOptions={{ exact: (item.to as string) === "/" }}
              activeProps={{ className: "active" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="wellness"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={handleBecomeVendor}
          >
            Become a Vendor
          </Button>
          <Link to="/search">
            <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </Button>
          </Link>
          <ThemeToggle />
          <CartButton />

          {/* Auth */}
          {loading ? (
            <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-muted-foreground"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.email}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">My Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/profile">My Wishlist</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/vendor">Vendor Dashboard</Link>
                </DropdownMenuItem>
                {(role === 'admin' || user?.email === 'siegaej@gmail.com' || user?.email === 'siegadevelopments@gmail.com' || user?.email === 'siegapython@gmail.com') ? (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="text-primary font-bold">Platform Admin</Link>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </Button>
            </Link>
          )}

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground md:hidden"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {mobileOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        ref={mobileMenuRef}
        className={`overflow-hidden border-t border-border/50 bg-background transition-all duration-300 ease-in-out md:hidden ${
          mobileOpen ? "max-h-[80vh] overflow-y-auto opacity-100" : "max-h-0 opacity-0 border-t-0"
        }`}
      >
        <nav className="flex flex-col gap-1 px-4 py-4">
          <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Explore</p>
          {exploreItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors [&.active]:text-primary [&.active]:bg-primary/10 ml-2"
              activeOptions={{ exact: (item.to as string) === "/" }}
              activeProps={{ className: "active" }}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <div className="h-px bg-border/50 my-2"></div>
          {topNavItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent hover:text-foreground transition-colors [&.active]:text-primary [&.active]:bg-primary/10"
              activeOptions={{ exact: (item.to as string) === "/" }}
              activeProps={{ className: "active" }}
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          {(role === 'admin' || user?.email === 'siegaej@gmail.com' || user?.email === 'siegadevelopments@gmail.com' || user?.email === 'siegapython@gmail.com') && (
            <Link
              to="/admin"
              className="rounded-md px-3 py-2.5 text-sm font-bold text-primary hover:bg-primary/10 transition-colors"
              onClick={() => setMobileOpen(false)}
            >
              Platform Admin
            </Link>
          )}
          <Button
            variant="wellness"
            size="sm"
            className="mt-4"
            onClick={handleBecomeVendor}
          >
            Become a Vendor
          </Button>
        </nav>
      </div>
    </header>
  );
}
