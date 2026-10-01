import { useEffect, useState } from "react";
import {
  LogOut,
  Menu,
  Search,
  X,
} from "lucide-react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { navigationItems } from "../data/navigation";
import { useMember } from "../lib/MemberContext";


function Navigation({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav
      className="sidebar__nav"
      aria-label="Navigasi utama"
    >
      {navigationItems.map(
        ({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onNavigate}
            className={({ isActive }) =>
              `nav-link${
                isActive
                  ? " nav-link--active"
                  : ""
              }`
            }
          >
            <Icon
              size={18}
              strokeWidth={1.7}
              aria-hidden="true"
            />

            <span>{label}</span>
          </NavLink>
        ),
      )}
    </nav>
  );
}


export function AppShell() {
  const [menuOpen, setMenuOpen] =
    useState(false);

  const [searchText, setSearchText] =
    useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const { member, logout } = useMember();

  const currentPage =
    navigationItems.find(
      (item) =>
        item.path === location.pathname,
    ) ??
    (location.pathname.startsWith("/media/")
      ? navigationItems.find((item) => item.path === "/media")
      : undefined);


  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);


  useEffect(() => {
    if (!menuOpen) return;

    const closeOnEscape = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener(
      "keydown",
      closeOnEscape,
    );

    return () =>
      window.removeEventListener(
        "keydown",
        closeOnEscape,
      );
  }, [menuOpen]);


  function submitSearch(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const query = searchText.trim();

    navigate(
      query
        ? `/media?q=${encodeURIComponent(query)}`
        : "/media",
    );
  }


  function handleLogout() {
    logout();
    navigate("/login", {
      replace: true,
    });
  }


  const memberName =
    member?.full_name ?? "Anggota";

  const memberRole =
    member?.role === "admin"
      ? "Admin"
      : "Staff";

  const memberInitial =
    memberName.charAt(0).toUpperCase();


  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
      >
        Lewati ke konten
      </a>


      <aside
        className="sidebar"
        aria-label="Menu aplikasi"
      >
        <Link
          className="wordmark"
          to="/dashboard"
          aria-label="MULIH Media Hub, Dashboard"
        >
          <span className="wordmark__name">
            Media Partner WCM
          </span>

          <span className="wordmark__descriptor">
            MEDIA HUB
          </span>
        </Link>


        <div className="sidebar__caption">
          RUANG KERJA HUMAS
        </div>


        <Navigation />


        <div className="sidebar__bottom">
          <div className="profile">
            <div
              className="profile__avatar"
              aria-hidden="true"
            >
              {memberInitial}
            </div>

            <div className="profile__copy">
              <strong>{memberName}</strong>

              <span>{memberRole}</span>
            </div>
          </div>


          <button
            type="button"
            className="sidebar__logout"
            onClick={() => void handleLogout()}
          >
            <LogOut
              size={15}
              strokeWidth={1.7}
              aria-hidden="true"
            />

            <span>Keluar</span>
          </button>
        </div>
      </aside>


      <div className="workspace">
        <header className="topbar">
          <div className="topbar__title">
            <button
              className="icon-button mobile-menu-button"
              type="button"
              aria-label={
                menuOpen
                  ? "Tutup menu"
                  : "Buka menu"
              }
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() =>
                setMenuOpen(
                  (open) => !open,
                )
              }
            >
              {menuOpen ? (
                <X size={20} />
              ) : (
                <Menu size={20} />
              )}

              <span className="mobile-menu-button__label">
                {menuOpen
                  ? "Tutup"
                  : "Menu"}
              </span>
            </button>


            <span className="topbar__eyebrow">
              MULIH / 2026
            </span>

            <h1>
              {currentPage?.label ??
                "MULIH Media Hub"}
            </h1>
          </div>


          <form
            className="search-form"
            role="search"
            onSubmit={submitSearch}
          >
            <Search
              size={17}
              aria-hidden="true"
            />

            <label
              className="sr-only"
              htmlFor="workspace-search"
            >
              Cari media
            </label>

            <input
              id="workspace-search"
              type="search"
              placeholder="Cari media..."
              value={searchText}
              onChange={(event) =>
                setSearchText(
                  event.target.value,
                )
              }
            />

            <kbd aria-hidden="true">
              Enter
            </kbd>
          </form>
        </header>


        {menuOpen && (
          <div
            className="mobile-navigation"
            id="mobile-navigation"
          >
            <Navigation
              onNavigate={() =>
                setMenuOpen(false)
              }
            />
          </div>
        )}


        <main
          className="main-content"
          id="main-content"
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}