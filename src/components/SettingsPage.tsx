import { CalendarDays, ExternalLink, LogOut, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useMember } from "../lib/MemberContext";

export function SettingsPage() {
  const { member, logout } = useMember();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="page-stack">
      <section className="page-intro">
        <p className="eyebrow">INFORMASI WORKSPACE</p>
        <h2>Settings</h2>
        <p>
          Jadwal, kontak, dan informasi MULIH Media Hub untuk kebutuhan kerja
          Humas.
        </p>
      </section>

      <div className="settings-layout">
        <section className="panel settings-event" aria-labelledby="settings-event">
          <div className="section-heading section-heading--compact">
            <div>
              <p className="eyebrow">INFORMASI EVENT</p>
              <h2 id="settings-event">
                WCM Creative Space: Mulih Art Exhibition
              </h2>
            </div>
            <CalendarDays size={19} aria-hidden="true" />
          </div>

          <dl className="settings-dates">
            <div>
              <dt>Open Call</dt>
              <dd>29 September sampai 30 Oktober 2026</dd>
            </div>
            <div>
              <dt>Exhibition</dt>
              <dd>13 sampai 15 November 2026</dd>
            </div>
            <div>
              <dt>Organizer</dt>
              <dd>UKM Bali Widyacana Murti Telkom University</dd>
            </div>
          </dl>

          <a
            className="settings-submission"
            href="https://bit.ly/3VZjb2u"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>
              <strong>Link submission Open Call</strong>
              <span>bit.ly/3VZjb2u</span>
            </span>
            <ExternalLink size={17} aria-hidden="true" />
          </a>
        </section>

        <div className="settings-side">
          <section className="panel settings-contact" aria-labelledby="settings-contact">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="eyebrow">KONTAK</p>
                <h2 id="settings-contact">PIC Humas</h2>
              </div>
              <Phone size={18} aria-hidden="true" />
            </div>
            <strong>Tio Krisna</strong>
            <a className="settings-contact__phone" href="tel:+62812154787712">
              +62 81215487712
            </a>
          </section>

          <section className="panel settings-app" aria-labelledby="settings-app">
            <p className="eyebrow">TENTANG APLIKASI</p>
            <h2 id="settings-app">MULIH Media Hub</h2>
            <p>
              Pengelolaan media dan kehumasan internal untuk MULIH Creative
              Space.
            </p>
          </section>

          <section className="panel settings-account" aria-labelledby="settings-account">
            <p className="eyebrow">SESI SAYA</p>
            <h2 id="settings-account">{member?.full_name ?? "Member"}</h2>
            <p className="settings-account__role">
              {member?.role === "admin" ? "Admin" : "Staff"}
            </p>
            <p className="settings-account__note">
              Akses aplikasi menggunakan pilihan nama member, bukan pengelolaan
              kata sandi atau akun autentikasi.
            </p>
            <button
              type="button"
              className="button button--secondary settings-account__logout"
              onClick={handleLogout}
            >
              <LogOut size={15} aria-hidden="true" />
              Keluar
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
