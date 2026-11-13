import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Camera,
  Heart,
  Bookmark,
  LockKeyhole,
  LogOut,
  X,
  Check,
  Trash2,
  ChevronRight,
  UserRound,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import Navbar from "../Components/Navbar";
import { img } from "../Library/Tmdb";
import { getUser, logout, saveUser } from "../Library/UserStore";
import {
  getMovieLists,
  removeMovieFromList,
  getUserProfile,
  updateUserProfile,
} from "../Redux/AuthAPI";

const TABS = [
  { key: "liked", label: "Liked", icon: Heart },
  { key: "watchlist", label: "My List", icon: Bookmark },
];

const LIST_TYPES = {
  liked: "likelist",
  watchlist: "watchlist",
};

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_IMG = "https://image.tmdb.org/t/p";

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  fullName: "",
  houseNo: "",
  area: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
};

const FIELD_CLASS =
  "w-full rounded-xl border border-white/10 bg-[#080B14]/80 px-3.5 py-2.5 text-base text-white outline-none transition-all duration-300 placeholder:text-slate-500 hover:border-[#8B5CF6]/50 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/20 read-only:cursor-not-allowed read-only:opacity-60 sm:text-sm";

const GLASS =
  "border border-white/10 bg-[#111827]/85 shadow-lg transition-colors duration-200";

const POSTER_GRID =
  "grid grid-cols-[repeat(auto-fill,minmax(clamp(110px,28vw,200px),1fr))] gap-2.5 sm:grid-cols-[repeat(auto-fill,minmax(clamp(135px,14vw,210px),1fr))] sm:gap-3.5 lg:gap-4";

const PANEL_ANIMATION = `
@keyframes profile-fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.profile-fade-in { animation: profile-fade-in 0.35s ease-out both; }
@media (prefers-reduced-motion: reduce) {
  .profile-fade-in { animation: none; }
}
`;

const initials = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  return (
    parts.length === 1
      ? parts[0].slice(0, 2)
      : parts[0][0] + parts[parts.length - 1][0]
  ).toUpperCase();
};

const getImageUrl = (profileImage) =>
  typeof profileImage === "string" ? profileImage : profileImage?.url || "";

const normalizeMovie = (movie) => {
  const mediaType =
    movie?.mediaType ||
    movie?.media_type ||
    (movie?.first_air_date || movie?.name ? "tv" : "movie");

  const poster =
    movie?.posterPath || movie?.poster_path || movie?.poster || "";

  const releaseDate =
    movie?.releaseDate || movie?.release_date || movie?.first_air_date || "";

  return {
    ...movie,
    id: movie?.tmdbId ?? movie?.id,
    mongoId: movie?._id,
    mediaType,
    title: movie?.title || movie?.name || "Untitled",
    poster,
    year: String(releaseDate).slice(0, 4),
  };
};

const scrollToRef = (ref, delay = 80) =>
  setTimeout(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, delay);

function useRandomTmdbBackground() {
  const [bg, setBg] = useState(null);

  useEffect(() => {
    if (!TMDB_KEY) return;

    const controller = new AbortController();
    const page = Math.floor(Math.random() * 5) + 1;

    fetch(
      `https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_KEY}&page=${page}`,
      { signal: controller.signal }
    )
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("TMDB"))))
      .then((data) => {
        const pool = (data?.results || []).filter(
          (m) => m.backdrop_path && m.poster_path
        );

        if (!pool.length) return;

        const pick = pool[Math.floor(Math.random() * pool.length)];

        setBg({
          backdrop: `${TMDB_IMG}/w1280${pick.backdrop_path}`,
          poster: `${TMDB_IMG}/w780${pick.poster_path}`,
        });
      })
      .catch(() => { });

    return () => controller.abort();
  }, []);

  return bg;
}

function Backdrop({ bg }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div aria-hidden className="fixed inset-0 z-0 overflow-hidden bg-[#080B14]">
      {bg && (
        <picture key={bg.poster}>
          <source media="(min-width: 768px)" srcSet={bg.backdrop} />
          <img
            src={bg.poster}
            alt=""
            onLoad={() => setLoaded(true)}
            className={`h-full w-full object-cover object-top transition-opacity duration-1000 ${
              loaded ? "opacity-30" : "opacity-0"
            }`}
          />
        </picture>
      )}

      {/* Layered cinematic gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#080B14]/60 via-[#080B14]/80 to-[#080B14]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(34,211,238,0.1)_0%,transparent_50%)]" />
    </div>
  );
}

function Avatar({ user, className = "" }) {
  const profileImage = getImageUrl(user?.profileImage);

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-tr from-[#8B5CF6] via-[#6366F1] to-[#22D3EE] font-bold text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] ring-2 ring-white/20 ${className}`}
    >
      {profileImage ? (
        <img
          src={profileImage}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : initials(user?.name) ? (
        initials(user.name)
      ) : (
        <UserRound className="h-1/2 w-1/2" />
      )}
    </span>
  );
}

function StatTile({ icon: Icon, label, value, active, onClick }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex min-w-0 items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors duration-200 sm:gap-4 sm:px-4 sm:py-3 ${
        active
          ? "border-[#8B5CF6] bg-[#8B5CF6]/15 text-white"
          : "border-white/10 bg-[#111827] text-slate-300 hover:border-white/20 hover:text-white"
      }`}
    >
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-9 sm:w-9 ${
          active
            ? "bg-[#8B5CF6] text-white"
            : "bg-white/10 text-slate-400"
        }`}
      >
        <Icon className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
      </span>

      <span className="min-w-0">
        <span className="block text-[clamp(1.1rem,2vw,1.4rem)] font-bold leading-none text-white">
          {value}
        </span>
        <span className="mt-1 block truncate text-[clamp(0.7rem,1.4vw,0.8rem)] font-medium text-slate-400">
          {label}
        </span>
      </span>
    </button>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  required = true,
  className = "",
  ...props
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={name} className="mb-1 block text-xs font-semibold text-slate-300">
        {label}
        {required && <span className="text-[#22D3EE]"> *</span>}
      </label>

      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={FIELD_CLASS}
        {...props}
      />
    </div>
  );
}

function ActionTile({ icon: Icon, title, text, danger, expanded, ...props }) {
  const Tag = props.to ? Link : "button";

  return (
    <Tag
      {...(Tag === "button" ? { type: "button" } : {})}
      {...props}
      className={`group flex w-full items-center gap-3.5 rounded-2xl border px-3.5 py-3 text-left backdrop-blur-xl transition-all duration-300 sm:px-4 sm:py-3.5 ${
        danger
          ? "border-red-500/20 bg-[#111827]/70 hover:border-red-500/60 hover:bg-red-950/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          : "border-white/10 bg-[#111827]/70 hover:border-[#8B5CF6]/60 hover:bg-[#111827] hover:shadow-[0_0_20px_rgba(139,92,246,0.2)]"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-300 sm:h-10 sm:w-10 ${
          danger
            ? "bg-red-500/10 text-red-400 group-hover:bg-red-500/20"
            : "bg-white/[0.06] text-slate-300 group-hover:bg-[#8B5CF6]/20 group-hover:text-[#22D3EE]"
        }`}
      >
        <Icon size={18} />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-sm font-bold ${
            danger ? "text-red-400" : "text-slate-100 group-hover:text-white"
          }`}
        >
          {title}
        </span>
        <span className="mt-0.5 block truncate text-xs text-slate-400">
          {text}
        </span>
      </span>

      <ChevronRight
        size={18}
        className={`shrink-0 text-slate-500 transition-transform duration-300 group-hover:text-[#22D3EE] ${
          expanded ? "rotate-90 text-[#22D3EE]" : ""
        }`}
      />
    </Tag>
  );
}

function UpdateProfilePanel({ onSaved, onClose }) {
  const fileRef = useRef(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [isGoogle, setIsGoogle] = useState(false);

  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fillForm = (u) =>
    setForm({
      name: u.name || "",
      email: u.email || "",
      phone: u.phone || "",
      fullName: u.address?.fullName || "",
      houseNo: u.address?.houseNo || "",
      area: u.address?.area || "",
      city: u.address?.city || "",
      state: u.address?.state || "",
      country: u.address?.country || "India",
      pincode: u.address?.pincode || "",
    });

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await getUserProfile();
        const u = res?.data?.data;

        if (!active || !u) return;

        setIsGoogle(u.authProvider === "google");
        setImageUrl(getImageUrl(u.profileImage));
        fillForm(u);
      } catch (err) {
        if (active) {
          setError(
            err?.response?.data?.message || "Unable to load your profile."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(
    () => () => {
      if (imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
    },
    [imageUrl]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    const next =
      name === "phone" || name === "pincode"
        ? value.replace(/\D/g, "")
        : value;

    setForm((previous) => ({ ...previous, [name]: next }));
    setError("");
    setSuccess("");
  };

  const pickImage = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image must be under 2MB.");
      return;
    }

    setImageFile(file);
    setRemoveImage(false);
    setImageUrl(URL.createObjectURL(file));
    setError("");
    setSuccess("");
  };

  const clearImage = () => {
    setImageFile(null);
    setImageUrl("");
    setRemoveImage(true);
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const values = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()])
    );

    if (values.name.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(values.email)) {
      setError("Enter a valid email address.");
      return;
    }

    const phoneInvalid = isGoogle
      ? values.phone && !/^\d{10}$/.test(values.phone)
      : !/^\d{10}$/.test(values.phone);

    if (phoneInvalid) {
      setError("Phone number must be 10 digits.");
      return;
    }

    if (!/^\d{6}$/.test(values.pincode)) {
      setError("Pincode must be 6 digits.");
      return;
    }

    const formData = new FormData();

    formData.append("name", values.name);
    formData.append("email", values.email);
    formData.append("phone", values.phone);
    formData.append(
      "address",
      JSON.stringify({
        fullName: values.fullName,
        houseNo: values.houseNo,
        area: values.area,
        city: values.city,
        state: values.state,
        country: values.country,
        pincode: values.pincode,
      })
    );

    if (imageFile) formData.append("profileImage", imageFile);
    if (removeImage) formData.append("removeImage", "true");

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await updateUserProfile(formData);
      const updated = res?.data?.data;

      if (updated) {
        saveUser({ ...getUser(), ...updated });
        window.dispatchEvent(new Event("auth-changed"));
        onSaved(updated);

        setImageUrl(getImageUrl(updated.profileImage));
        fillForm(updated);
      }

      setImageFile(null);
      setRemoveImage(false);
      setSuccess(res?.data?.message || "Profile updated successfully.");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Unable to update profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex justify-center rounded-2xl py-12 ${GLASS}`}>
        <LoaderCircle className="h-7 w-7 animate-spin text-[#8B5CF6]" />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`profile-fade-in rounded-2xl p-4 sm:p-6 lg:grid lg:grid-cols-[220px_1fr] lg:gap-8 lg:p-7 ${GLASS}`}
    >
      {/* Photo Column */}
      <div className="flex items-center gap-4 lg:flex-col lg:items-center lg:gap-4 lg:text-center">
        <div className="relative">
          <Avatar
            user={{ name: form.name, profileImage: imageUrl }}
            className="h-20 w-20 text-2xl sm:h-24 sm:w-24 sm:text-3xl lg:h-32 lg:w-32 lg:text-4xl"
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Change photo"
            className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#080B14]/60 opacity-90 backdrop-blur-sm transition-all duration-300 hover:bg-[#080B14]/80 hover:opacity-100"
          >
            <Camera size={22} className="text-[#22D3EE]" />
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={pickImage}
          />
        </div>

        <div className="flex min-w-0 flex-col items-start gap-1.5 lg:items-center">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-xs font-bold text-[#22D3EE] transition-colors hover:text-[#8B5CF6]"
          >
            Change photo
          </button>

          {imageUrl && (
            <button
              type="button"
              onClick={clearImage}
              className="flex items-center gap-1.5 text-xs text-slate-400 transition-colors hover:text-red-400"
            >
              <Trash2 size={13} />
              Remove photo
            </button>
          )}

          <p className="text-[11px] text-slate-500">JPG or PNG, up to 2MB</p>
        </div>
      </div>

      {/* Fields Column */}
      <div className="mt-5 min-w-0 lg:mt-0">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#8B5CF6]">Personal details</h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Field
            label="Full name"
            name="name"
            value={form.name}
            onChange={handleChange}
            maxLength={50}
            autoComplete="name"
          />

          <Field
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            readOnly={isGoogle}
            autoComplete="email"
          />

          <Field
            label="Phone"
            name="phone"
            type="tel"
            inputMode="numeric"
            value={form.phone}
            onChange={handleChange}
            maxLength={10}
            required={!isGoogle}
            autoComplete="tel"
            className="sm:col-span-2 xl:col-span-1"
          />
        </div>

        <h3 className="mb-3 mt-6 text-sm font-bold uppercase tracking-wider text-[#22D3EE]">Address details</h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Field
            label="Recipient name"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
          />

          <Field
            label="House / Flat no."
            name="houseNo"
            value={form.houseNo}
            onChange={handleChange}
          />

          <Field
            label="Area / Street"
            name="area"
            value={form.area}
            onChange={handleChange}
            className="sm:col-span-2 xl:col-span-1"
          />

          <Field
            label="City"
            name="city"
            value={form.city}
            onChange={handleChange}
          />

          <Field
            label="State"
            name="state"
            value={form.state}
            onChange={handleChange}
          />

          <Field
            label="Country"
            name="country"
            value={form.country}
            onChange={handleChange}
          />

          <Field
            label="Pincode"
            name="pincode"
            inputMode="numeric"
            value={form.pincode}
            onChange={handleChange}
            maxLength={6}
            autoComplete="postal-code"
            className="sm:col-span-2 xl:col-span-1"
          />
        </div>

        {error && (
          <p role="alert" className="mt-3.5 break-words text-xs font-semibold text-red-400">
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="mt-3.5 text-xs font-semibold text-[#22D3EE]">
            {success}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <button
            type="submit"
            disabled={saving}
            className="flex h-10 items-center justify-center gap-2 rounded-md bg-[#8B5CF6] px-5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-[#7C3AED] active:scale-95 disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle size={14} className="animate-spin" />
            ) : (
              <Check size={15} strokeWidth={2.5} />
            )}
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-10 items-center justify-center gap-1.5 rounded-md border border-white/20 bg-[#111827] px-4 text-xs font-semibold text-slate-300 transition-colors duration-200 hover:bg-white/10 hover:text-white disabled:opacity-60"
          >
            <X size={14} />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </form>
  );
}

export default function Profile() {
  const navigate = useNavigate();

  const listsRef = useRef(null);
  const accountRef = useRef(null);
  const panelRef = useRef(null);

  const tmdbBg = useRandomTmdbBackground();

  const [user, setUser] = useState(getUser());
  const [tab, setTab] = useState("liked");

  const [lists, setLists] = useState({
    liked: [],
    watchlist: [],
  });

  const [listsLoading, setListsLoading] = useState(true);
  const [removingId, setRemovingId] = useState("");
  const [listError, setListError] = useState("");
  const [fallbackBg, setFallbackBg] = useState(null);

  const [updateOpen, setUpdateOpen] = useState(false);
  const [panelMounted, setPanelMounted] = useState(false);

  const openUpdate = () => {
    setPanelMounted(true);
    setUpdateOpen(true);
    scrollToRef(panelRef, 150);
  };

  const toggleUpdate = () => {
    if (updateOpen) {
      setUpdateOpen(false);
      return;
    }
    openUpdate();
  };

  const closeUpdate = () => {
    setUpdateOpen(false);
    scrollToRef(accountRef, 60);
  };

  const showTab = (key) => {
    setTab(key);
    scrollToRef(listsRef, 40);
  };

  const fetchLists = useCallback(async () => {
    if (!localStorage.getItem("userToken")) {
      navigate("/login", { replace: true });
      return;
    }

    setListsLoading(true);
    setListError("");

    try {
      const response = await getMovieLists();
      const data = response?.data?.data ?? response?.data ?? response;

      if (!data || typeof data !== "object") {
        throw new Error("Invalid movie-list response from the server.");
      }

      const liked = Array.isArray(data.likelist)
        ? data.likelist.map(normalizeMovie)
        : [];
      const watchlist = Array.isArray(data.watchlist)
        ? data.watchlist.map(normalizeMovie)
        : [];

      setLists({ liked, watchlist });

      setFallbackBg((current) => {
        if (current) return current;
        const withPoster = [...liked, ...watchlist].filter((m) => m.poster);
        if (!withPoster.length) return null;
        const pick = withPoster[Math.floor(Math.random() * withPoster.length)];
        return { backdrop: img(pick.poster), poster: img(pick.poster) };
      });
    } catch (err) {
      const status = err?.response?.status;

      setListError(
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load your saved titles. Please try again."
      );

      if (status === 401) {
        logout();
        navigate("/login", { replace: true });
      }
    } finally {
      setListsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const syncUser = () => setUser(getUser());
    const syncLists = () => fetchLists();

    if (!localStorage.getItem("userToken")) {
      const redirectTimer = setTimeout(() => {
        setListsLoading(false);
        navigate("/login", { replace: true });
      }, 0);
      return () => clearTimeout(redirectTimer);
    }

    const loadTimer = setTimeout(() => {
      fetchLists();
    }, 0);

    window.addEventListener("auth-changed", syncUser);
    window.addEventListener("lists-changed", syncLists);

    return () => {
      clearTimeout(loadTimer);
      window.removeEventListener("auth-changed", syncUser);
      window.removeEventListener("lists-changed", syncLists);
    };
  }, [fetchLists, navigate]);

  const handleLogout = () => {
    logout();
    window.dispatchEvent(new Event("auth-changed"));
    navigate("/", { replace: true });
  };

  const handleRemove = async (item) => {
    const mongoId = item.mongoId;

    if (!mongoId || removingId) {
      setListError(
        "This title has no valid database ID. Refresh your list and try again."
      );
      return;
    }

    const listType = LIST_TYPES[tab];

    setRemovingId(String(mongoId));
    setListError("");

    try {
      await removeMovieFromList(listType, mongoId);

      setLists((previous) => ({
        ...previous,
        [tab]: previous[tab].filter(
          (movie) => String(movie.mongoId) !== String(mongoId)
        ),
      }));

      window.dispatchEvent(new Event("lists-changed"));
    } catch (err) {
      setListError(
        err?.response?.data?.message ||
        "Unable to remove this title. Please try again."
      );

      if (err?.response?.status === 401) {
        logout();
        navigate("/login", { replace: true });
      }
    } finally {
      setRemovingId("");
    }
  };

  if (!user) return null;

  const items = lists[tab];
  const activeTab = TABS.find((t) => t.key === tab);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#080B14] text-white">
      <style>{PANEL_ANIMATION}</style>

      <Backdrop bg={tmdbBg || fallbackBg} />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />

        <main className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col gap-4 px-3 pb-8 pt-20 sm:gap-5 sm:px-6 sm:pt-24 lg:px-10 2xl:px-14">
          {/* Header Card */}
          <section
            className={`flex flex-col gap-4 rounded-2xl p-4 sm:p-6 lg:p-7 ${GLASS}`}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
              <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                <Avatar
                  user={user}
                  className="h-16 w-16 text-xl sm:h-20 sm:w-20 sm:text-2xl lg:h-24 lg:w-24 lg:text-3xl"
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="truncate text-[clamp(1.2rem,3vw,2.2rem)] font-black leading-tight text-white">
                      {user.name || "Your profile"}
                    </h1>
                    <span className="rounded-full border border-[#8B5CF6]/40 bg-[#8B5CF6]/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#22D3EE]">
                      VIP Member
                    </span>
                  </div>

                  {user.email && (
                    <p className="mt-1 truncate text-xs text-slate-300 sm:text-sm">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div
                role="tablist"
                aria-label="Saved movies"
                className="grid grid-cols-2 gap-2.5 sm:gap-3.5 lg:w-[clamp(320px,34vw,480px)] lg:shrink-0"
              >
                {TABS.map(({ key, label, icon }) => (
                  <StatTile
                    key={key}
                    icon={icon}
                    label={label}
                    value={lists[key].length}
                    active={tab === key}
                    onClick={() => showTab(key)}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Saved Titles Section */}
          <section
            ref={listsRef}
            className={`flex flex-1 scroll-mt-20 flex-col rounded-2xl p-4 sm:scroll-mt-24 sm:p-6 lg:p-7 ${GLASS}`}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex min-w-0 items-center gap-2.5 text-base font-bold sm:text-xl">
                {activeTab && (
                  <activeTab.icon className="h-5 w-5 shrink-0 text-[#22D3EE]" />
                )}
                <span className="truncate">{activeTab?.label}</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-semibold text-[#8B5CF6]">
                  {items.length} titles
                </span>
              </h2>
            </div>

            {listError && (
              <div
                role="alert"
                className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              >
                <span className="min-w-0 break-words">{listError}</span>
                <button
                  type="button"
                  onClick={fetchLists}
                  className="shrink-0 font-bold text-[#22D3EE] underline underline-offset-4 hover:text-white"
                >
                  Retry
                </button>
              </div>
            )}

            {listsLoading ? (
              <div className="flex flex-1 items-center justify-center py-16">
                <LoaderCircle className="h-9 w-9 animate-spin text-[#8B5CF6]" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/15 shadow-[0_0_20px_rgba(139,92,246,0.25)]">
                  {tab === "liked" ? (
                    <Heart className="h-7 w-7 text-[#22D3EE]" />
                  ) : (
                    <Bookmark className="h-7 w-7 text-[#8B5CF6]" />
                  )}
                </div>

                <p className="mt-5 text-lg font-bold text-white">
                  {tab === "liked" ? "No liked movies yet" : "Your list is waiting"}
                </p>

                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
                  {tab === "liked"
                    ? "Click the thumbs up icon on any title to save your favorite movies and shows here."
                    : "Add upcoming or interesting titles to My List to build your personal watchlist."}
                </p>

                <Link
                  to="/"
                  className="mt-5 inline-flex items-center justify-center rounded-md bg-[#8B5CF6] px-5 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-[#7C3AED]"
                >
                  Browse titles
                </Link>
              </div>
            ) : (
              <ul className={POSTER_GRID}>
                {items.map((item) => (
                  <li
                    key={`${item.mediaType}-${item.mongoId}`}
                    className="group relative min-w-0"
                  >
                    <Link
                      to={`/watch/${item.mediaType}/${item.id}`}
                      className="relative block overflow-hidden rounded-xl border border-white/10 bg-[#111827] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#8B5CF6] hover:shadow-[0_8px_25px_rgba(0,0,0,0.6),0_0_20px_rgba(139,92,246,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6]"
                    >
                      <div className="aspect-[2/3] w-full overflow-hidden bg-[#151d30]">
                        {item.poster ? (
                          <img
                            src={img(item.poster)}
                            alt={item.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center p-3 text-center text-xs text-slate-400">
                            {item.title}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 bg-[#080B14]/90 px-2.5 py-2">
                        <p className="truncate text-xs font-bold text-white">
                          {item.title}
                        </p>

                        <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">
                          {item.year || "—"} ·{" "}
                          <span className="text-[#22D3EE] uppercase tracking-wide">
                            {item.mediaType === "tv" ? "Series" : "Movie"}
                          </span>
                        </p>
                      </div>
                    </Link>

                    {/* Quick remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemove(item)}
                      disabled={removingId === String(item.mongoId)}
                      aria-label={`Remove ${item.title}`}
                      title="Remove from list"
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-[#080B14]/85 text-slate-300 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-red-400 hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 sm:w-8 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100"
                    >
                      {removingId === String(item.mongoId) ? (
                        <LoaderCircle size={14} className="animate-spin text-red-400" />
                      ) : (
                        <X size={14} />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Account Settings Section */}
          <section ref={accountRef} className="scroll-mt-20 sm:scroll-mt-24">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#8B5CF6]">
              Account & Security
            </h2>

            <div className="grid grid-cols-1 gap-2.5 sm:gap-3.5 md:grid-cols-3">
              <ActionTile
                icon={UserRound}
                title="Update profile"
                text="Name, photo, phone & address"
                expanded={updateOpen}
                aria-expanded={updateOpen}
                aria-controls="update-profile-panel"
                onClick={toggleUpdate}
              />

              <ActionTile
                icon={LockKeyhole}
                title="Change password"
                text="Update your sign-in password"
                to="/change-password"
              />

              <ActionTile
                icon={LogOut}
                title="Sign out"
                text="Sign out of your session"
                danger
                onClick={handleLogout}
              />
            </div>

            {/* Smooth Collapsible Edit Panel */}
            <div
              id="update-profile-panel"
              ref={panelRef}
              aria-hidden={!updateOpen}
              className={`grid scroll-mt-20 transition-[grid-template-rows,margin,opacity] duration-500 ease-in-out sm:scroll-mt-24 ${
                updateOpen
                  ? "mt-3 grid-rows-[1fr] opacity-100"
                  : "invisible mt-0 grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="min-h-0 overflow-hidden">
                {panelMounted && (
                  <UpdateProfilePanel
                    onSaved={(updated) => setUser(getUser() || updated)}
                    onClose={closeUpdate}
                  />
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
