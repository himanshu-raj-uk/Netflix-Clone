import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Camera,
  Heart,
  Bookmark,
  LockKeyhole,
  LogOut,
  Pencil,
  X,
  Check,
  Trash2,
  ChevronRight,
  UserRound,
  LoaderCircle,
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

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const TABS = [
  { key: "liked", label: "Liked", icon: Heart },
  { key: "watchlist", label: "My List", icon: Bookmark },
];

const LIST_TYPES = {
  liked: "likelist",
  watchlist: "watchlist",
};

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB (matches multer limit on backend)

// Vite: VITE_TMDB_API_KEY in .env  |  CRA: use process.env.REACT_APP_TMDB_API_KEY instead
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

// text-base on mobile stops iOS zooming into inputs, sm:text-sm on larger screens
const FIELD_CLASS =
  "w-full rounded-lg border border-white/20 bg-transparent px-3 py-2 text-base outline-none transition-all duration-300 placeholder:text-gray-600 hover:border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 read-only:cursor-not-allowed read-only:opacity-60 sm:text-sm";

// Transparent panel. Red border lines appear while the mouse is over it.
const GLASS =
  "border border-white/10 bg-transparent backdrop-blur-[3px] transition-all duration-300 ease-out hover:border-red-500/80 hover:shadow-[0_0_0_1px_rgba(239,68,68,0.25),0_0_24px_rgba(239,68,68,0.12)]";

// Responsive poster grid: columns grow/shrink with the free width
const POSTER_GRID =
  "grid grid-cols-[repeat(auto-fill,minmax(clamp(100px,28vw,200px),1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(clamp(130px,14vw,210px),1fr))] sm:gap-3 lg:gap-4";

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

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                     Random TMDB background (changes on refresh)            */
/* -------------------------------------------------------------------------- */

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
  const imgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    if (imgRef.current?.complete) setLoaded(true);
  }, [bg?.poster]);

  return (
    <div aria-hidden className="fixed inset-0 z-0 overflow-hidden bg-black">
      {bg && (
        <picture key={bg.poster}>
          {/* wide screens get the landscape backdrop, phones get the portrait poster */}
          <source media="(min-width: 768px)" srcSet={bg.backdrop} />
          <img
            ref={imgRef}
            src={bg.poster}
            alt=""
            onLoad={() => setLoaded(true)}
            className={`h-full w-full object-cover object-top transition-opacity duration-1000 ${loaded ? "opacity-60" : "opacity-0"
              }`}
          />
        </picture>
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/65 to-black/95" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Components                                 */
/* -------------------------------------------------------------------------- */

function Avatar({ user, className = "" }) {
  const profileImage = getImageUrl(user?.profileImage);

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-red-800 font-bold text-white ring-1 ring-white/20 ${className}`}
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
      className={`flex min-w-0 items-center gap-2.5 rounded-xl border bg-transparent px-3 py-2 text-left transition-all duration-300 sm:gap-3 sm:px-4 sm:py-2.5 ${active
          ? "border-red-500/70 bg-red-600/15"
          : "border-white/10 hover:border-red-500/70 hover:bg-white/[0.05]"
        }`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-600/15 text-red-400 sm:h-9 sm:w-9">
        <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
      </span>

      <span className="min-w-0">
        <span className="block text-[clamp(1.05rem,2.2vw,1.5rem)] font-bold leading-none">
          {value}
        </span>
        <span className="mt-1 block truncate text-[clamp(0.68rem,1.4vw,0.8rem)] text-gray-300">
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
      <label htmlFor={name} className="mb-1 block text-xs text-gray-300">
        {label}
        {required && <span className="text-red-500"> *</span>}
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
      className={`group flex w-full items-center gap-3 rounded-xl border bg-transparent px-3 py-2.5 text-left backdrop-blur-[3px] transition-all duration-300 sm:px-4 sm:py-3 ${danger
          ? "border-red-500/25 hover:border-red-500 hover:bg-red-600/10"
          : "border-white/10 hover:border-red-500/80 hover:bg-white/[0.04]"
        }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-300 sm:h-10 sm:w-10 ${danger
            ? "bg-red-600/10 text-red-500 group-hover:bg-red-600/20"
            : "bg-white/[0.06] text-gray-300 group-hover:bg-red-600/15 group-hover:text-red-400"
          }`}
      >
        <Icon size={18} />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-[clamp(0.8rem,1.6vw,0.95rem)] font-semibold ${danger ? "text-red-400" : ""
            }`}
        >
          {title}
        </span>
        <span className="mt-0.5 block truncate text-[clamp(0.68rem,1.4vw,0.8rem)] text-gray-300">
          {text}
        </span>
      </span>

      <ChevronRight
        size={18}
        className={`shrink-0 text-gray-400 transition-transform duration-300 group-hover:text-red-400 ${expanded ? "rotate-90" : ""
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

  // Load the latest profile from the server (MongoDB)
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

  // Release blob preview URLs when they change / on unmount
  useEffect(
    () => () => {
      if (imageUrl.startsWith("blob:")) URL.revokeObjectURL(imageUrl);
    },
    [imageUrl]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;

    // digits only for phone + pincode
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
        // keep local user in sync with what MongoDB returned
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
      <div className={`flex justify-center rounded-2xl py-10 ${GLASS}`}>
        <LoaderCircle className="h-6 w-6 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`profile-fade-in rounded-2xl p-3 sm:p-5 lg:grid lg:grid-cols-[200px_1fr] lg:gap-8 lg:p-6 ${GLASS}`}
    >
      {/* Photo */}
      <div className="flex items-center gap-4 lg:flex-col lg:items-center lg:gap-3 lg:text-center">
        <div className="relative">
          <Avatar
            user={{ name: form.name, profileImage: imageUrl }}
            className="h-20 w-20 text-2xl sm:h-24 sm:w-24 sm:text-3xl lg:h-32 lg:w-32 lg:text-4xl"
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Change photo"
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-90 transition-all duration-300 hover:bg-black/75 hover:opacity-100"
          >
            <Camera size={22} />
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
            className="text-sm font-semibold text-red-400 transition-colors hover:text-red-300"
          >
            Change photo
          </button>

          {imageUrl && (
            <button
              type="button"
              onClick={clearImage}
              className="flex items-center gap-1.5 text-sm text-gray-300 transition-colors hover:text-red-400"
            >
              <Trash2 size={14} />
              Remove photo
            </button>
          )}

          <p className="text-xs text-gray-400">JPG or PNG, up to 2MB</p>
        </div>
      </div>

      {/* Fields */}
      <div className="mt-4 min-w-0 lg:mt-0">
        <h3 className="mb-2 text-sm font-semibold">Personal details</h3>

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

        <h3 className="mb-2 mt-4 text-sm font-semibold">Address</h3>

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
          <p role="alert" className="mt-3 break-words text-sm text-red-400">
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="mt-3 text-sm text-green-400">
            {success}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 sm:max-w-sm">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Check size={15} />
            )}
            {saving ? "Saving..." : "Save"}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold transition-all duration-300 hover:border-red-500/70 hover:bg-white/5 disabled:opacity-60"
          >
            <X size={15} />
            Close
          </button>
        </div>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Page                                    */
/* -------------------------------------------------------------------------- */

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
  // Panel is mounted on first open and then only collapsed/expanded (smooth)
  const [panelMounted, setPanelMounted] = useState(false);

  /* --------------------------- Update panel + scroll -------------------------- */

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

  /* --------------------------------- Lists --------------------------------- */

  const fetchLists = useCallback(async () => {
    if (!localStorage.getItem("userToken")) {
      setListsLoading(false);
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

      // backup background (only used if TMDB fetch is unavailable)
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
      setListsLoading(false);
      navigate("/login", { replace: true });
      return;
    }

    fetchLists();

    window.addEventListener("auth-changed", syncUser);
    window.addEventListener("lists-changed", syncLists);

    return () => {
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
    <div className="relative min-h-screen overflow-x-hidden bg-black text-white">
      <style>{PANEL_ANIMATION}</style>

      <Backdrop bg={tmdbBg || fallbackBg} />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />

        {/* flex-1 lets the saved titles use all the free height */}
        <main className="mx-auto flex w-full max-w-[1920px] flex-1 flex-col gap-3 px-2 pb-6 pt-16 sm:gap-4 sm:px-4 sm:pt-20 lg:px-6 2xl:px-8">
          {/* Header card */}
          <section
            className={`flex flex-col gap-3 rounded-2xl p-3 sm:p-4 lg:p-5 ${GLASS}`}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
              <div className="flex min-w-0 items-center gap-3 sm:gap-5">
                <Avatar
                  user={user}
                  className="h-14 w-14 text-lg sm:h-20 sm:w-20 sm:text-2xl lg:h-24 lg:w-24 lg:text-3xl"
                />

                <div className="min-w-0">
                  <h1 className="truncate text-[clamp(1.1rem,3vw,2rem)] font-bold leading-tight">
                    {user.name || "Your profile"}
                  </h1>

                  {user.email && (
                    <p className="mt-0.5 truncate text-[clamp(0.72rem,1.6vw,0.9rem)] text-gray-300">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>

              <div
                role="tablist"
                aria-label="Saved movies"
                className="grid grid-cols-2 gap-2 sm:gap-3 lg:w-[clamp(300px,34vw,480px)] lg:shrink-0"
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

          {/* Saved titles */}
          <section
            ref={listsRef}
            className={`flex flex-1 scroll-mt-16 flex-col rounded-2xl p-3 sm:scroll-mt-20 sm:p-4 lg:p-5 ${GLASS}`}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="flex min-w-0 items-center gap-2 text-[clamp(0.95rem,2vw,1.25rem)] font-semibold">
                {activeTab && (
                  <activeTab.icon className="h-4 w-4 shrink-0 text-red-500 sm:h-5 sm:w-5" />
                )}
                <span className="truncate">{activeTab?.label}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-gray-300">
                  {items.length}
                </span>
              </h2>
            </div>

            {listError && (
              <div
                role="alert"
                className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200"
              >
                <span className="min-w-0 break-words">{listError}</span>

                <button
                  type="button"
                  onClick={fetchLists}
                  className="shrink-0 font-semibold text-red-300 underline underline-offset-4 transition-colors hover:text-white"
                >
                  Retry
                </button>
              </div>
            )}

            {listsLoading ? (
              <div className="flex flex-1 items-center justify-center py-12">
                <LoaderCircle className="h-8 w-8 animate-spin text-red-500" />
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10">
                  {tab === "liked" ? (
                    <Heart className="h-6 w-6 text-red-500" />
                  ) : (
                    <Bookmark className="h-6 w-6 text-red-500" />
                  )}
                </div>

                <p className="mt-4 text-[clamp(0.95rem,2vw,1.15rem)] font-semibold">
                  {tab === "liked" ? "Nothing liked yet" : "Your list is empty"}
                </p>

                <p className="mx-auto mt-1.5 max-w-xs text-[clamp(0.8rem,1.6vw,0.9rem)] leading-relaxed text-gray-300">
                  {tab === "liked"
                    ? "Tap the Like button on any movie or show and it will show up here."
                    : "Add movies and shows to My List to keep track of what to watch next."}
                </p>

                <Link
                  to="/"
                  className="mt-5 inline-flex items-center justify-center rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold transition-all duration-300 hover:bg-red-500"
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
                      className="profile-movie-card relative block overflow-hidden rounded-lg border border-red-600/70 bg-black/30 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-red-400 hover:shadow-[0_0_8px_rgba(239,68,68,0.35),0_0_22px_rgba(239,68,68,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                    >
                      {/* poster fills whatever width the grid column gives it */}
                      <div className="aspect-[2/3] w-full overflow-hidden bg-[#181818]">
                        {item.poster ? (
                          <img
                            src={img(item.poster)}
                            alt={item.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center p-3 text-center text-[clamp(0.7rem,1.5vw,0.85rem)] text-gray-300">
                            {item.title}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 bg-black/60 px-2 py-1.5 sm:px-3 sm:py-2">
                        <p className="truncate text-[clamp(0.72rem,1.5vw,0.9rem)] font-semibold text-white">
                          {item.title}
                        </p>

                        <p className="mt-0.5 truncate text-[clamp(0.62rem,1.2vw,0.78rem)] text-gray-300">
                          {item.year || "—"} ·{" "}
                          {item.mediaType === "tv" ? "Series" : "Movie"}
                        </p>
                      </div>
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleRemove(item)}
                      disabled={removingId === String(item.mongoId)}
                      aria-label={`Remove ${item.title}`}
                      title="Remove from list"
                      className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/80 text-white shadow-lg transition-all duration-300 hover:border-red-400 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:h-8 sm:w-8 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100"
                    >
                      {removingId === String(item.mongoId) ? (
                        <LoaderCircle size={14} className="animate-spin" />
                      ) : (
                        <X size={14} />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Account */}
          <section ref={accountRef} className="scroll-mt-16 sm:scroll-mt-20">
            <h2 className="mb-2 text-[clamp(0.95rem,2vw,1.15rem)] font-semibold">
              Account
            </h2>

            <div className="grid grid-cols-1 gap-2 sm:gap-3 md:grid-cols-3">
              <ActionTile
                icon={UserRound}
                title="Update profile"
                text="Name, photo, phone and address"
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
                text="Sign out of this device"
                danger
                onClick={handleLogout}
              />
            </div>

            {/* Smooth expand / collapse */}
            <div
              id="update-profile-panel"
              ref={panelRef}
              aria-hidden={!updateOpen}
              className={`grid scroll-mt-16 transition-[grid-template-rows,margin,opacity] duration-500 ease-in-out sm:scroll-mt-20 ${updateOpen
                  ? "mt-2 grid-rows-[1fr] opacity-100 sm:mt-3"
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