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

const LIST_TYPES = {
  liked: "likelist",
  watchlist: "watchlist",
};

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const TMDB_KEY = import.meta.env.VITE_TMDB_API_KEY;

const FIELD_CLASS =
  "w-full rounded-lg border border-white/15 bg-transparent px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#22D3EE]";

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

const getImageUrl = (image) =>
  typeof image === "string" ? image : image?.url || "";

const normalizeMovie = (movie) => ({
  ...movie,
  id: movie?.tmdbId ?? movie?.id,
  mongoId: movie?._id || movie?.mongoId,
  mediaType:
    movie?.mediaType ||
    movie?.media_type ||
    (movie?.first_air_date || movie?.name ? "tv" : "movie"),
  title: movie?.title || movie?.name || "Untitled",
  poster: movie?.posterPath || movie?.poster_path || movie?.poster || "",
  year: String(
    movie?.releaseDate || movie?.release_date || movie?.first_air_date || "",
  ).slice(0, 4),
});

const scrollToRef = (ref, delay = 80) => {
  setTimeout(() => {
    ref.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, delay);
};

/* BACKGROUND */

function Backdrop() {
  const [background, setBackground] = useState("");

  useEffect(() => {
    if (!TMDB_KEY) return;

    const controller = new AbortController();

    fetch(
      `https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_KEY}`,
      { signal: controller.signal },
    )
      .then((res) => {
        if (!res.ok) throw new Error("Background unavailable");
        return res.json();
      })
      .then((data) => {
        const movies = (data.results || []).filter(
          (movie) => movie.backdrop_path,
        );

        if (!movies.length) return;

        const movie = movies[Math.floor(Math.random() * movies.length)];

        setBackground(`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`);
      })
      .catch(() => {});

    return () => controller.abort();
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#080B14]">
      {background && (
        <img
          src={background}
          alt=""
          className="h-full w-full object-cover object-top opacity-25"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-[#080B14]/70 via-[#080B14]/85 to-[#080B14]" />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.15),transparent_60%)]" />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(34,211,238,0.09),transparent_50%)]" />
    </div>
  );
}

/* FORM FIELD */

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
      <label
        htmlFor={name}
        className="mb-1 block text-xs font-semibold text-slate-300"
      >
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

/* ACCOUNT ACTION */

function ActionTile({ icon: Icon, title, text, danger, expanded, ...props }) {
  const Tag = props.to ? Link : "button";

  return (
    <Tag
      {...(Tag === "button" ? { type: "button" } : {})}
      {...props}
      className={`group flex min-h-[48px] w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all duration-300 ${
        danger
          ? "border-white/10 hover:border-red-500/60"
          : "border-white/10 hover:border-[#8B5CF6]/60"
      }`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-300 group-hover:text-[#22D3EE]">
        <Icon size={17} />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-sm font-bold ${
            danger ? "text-red-400" : "text-slate-100"
          }`}
        >
          {title}
        </span>

        <span className="mt-0.5 block truncate text-[11px] text-slate-400">
          {text}
        </span>
      </span>

      <ChevronRight
        size={17}
        className={`shrink-0 text-slate-500 transition-transform group-hover:text-[#22D3EE] ${
          expanded ? "rotate-90" : ""
        }`}
      />
    </Tag>
  );
}

/* MOVIE CAROUSEL */

function MovieListSection({
  title,
  icon: Icon,
  movies,
  listKey,
  removingId,
  onRemove,
}) {
  const trackRef = useRef(null);

  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    scrollLeft: 0,
  });

  const [slider, setSlider] = useState({
    progress: 0,
    thumb: 100,
    overflow: false,
  });

  const updateSlider = useCallback(() => {
    const element = trackRef.current;
    if (!element) return;

    const maxScroll = element.scrollWidth - element.clientWidth;
    const overflow = maxScroll > 2;

    const thumb = overflow
      ? Math.min(100, (element.clientWidth / element.scrollWidth) * 100)
      : 100;

    setSlider({
      progress: overflow ? element.scrollLeft / maxScroll : 0,
      thumb,
      overflow,
    });
  }, []);

  useEffect(() => {
    const element = trackRef.current;
    if (!element) return;

    updateSlider();

    const observer = new ResizeObserver(updateSlider);
    observer.observe(element);

    element.addEventListener("scroll", updateSlider, {
      passive: true,
    });

    window.addEventListener("resize", updateSlider);

    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", updateSlider);
      window.removeEventListener("resize", updateSlider);
    };
  }, [movies.length, updateSlider]);

  const handlePointerDown = (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) {
      return;
    }

    const element = trackRef.current;
    if (!element) return;

    dragRef.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      scrollLeft: element.scrollLeft,
    };
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    const element = trackRef.current;

    if (!drag.active || !element) return;

    const distance = event.clientX - drag.startX;

    if (Math.abs(distance) > 4) {
      drag.moved = true;
      element.classList.add("cursor-grabbing");
      element.classList.remove("cursor-pointer");
    }

    if (drag.moved) {
      element.scrollLeft = drag.scrollLeft - distance;
    }
  };

  const handlePointerUp = () => {
    const element = trackRef.current;

    if (element) {
      element.classList.remove("cursor-grabbing");
      element.classList.add("cursor-pointer");
    }

    dragRef.current.active = false;
  };

  const preventDraggedClick = (event) => {
    if (dragRef.current.moved) {
      event.preventDefault();
      event.stopPropagation();
      dragRef.current.moved = false;
    }
  };

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#080B14]/40 p-3 transition-colors hover:border-[#8B5CF6]/50 sm:p-3.5 lg:p-3.5">
      {/* HEADER */}

      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-white sm:text-base">
          <Icon className="h-5 w-5 shrink-0 text-[#D946EF]" />
          {title}
        </h2>

        <span className="shrink-0 rounded-full bg-[#8B5CF6]/15 px-2.5 py-1 text-[10px] font-semibold text-white sm:text-xs">
          {movies.length} movies
        </span>
      </div>

      {movies.length === 0 ? (
        <div className="flex min-h-[100px] flex-col items-center justify-center gap-2">
          <Icon size={24} className="text-[#8B5CF6]" />

          <p className="text-xs text-slate-400">No movies added yet</p>

          <Link to="/" className="text-xs font-semibold text-[#22D3EE]">
            Explore movies
          </Link>
        </div>
      ) : (
        <>
          {/* SLIDER TRACK */}

          <div className="px-0.5 pt-1">
            <div
              ref={trackRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onClickCapture={preventDraggedClick}
              className="flex w-full cursor-default snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-2 select-none sm:gap-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {movies.map((rawMovie) => {
                const movie = normalizeMovie(rawMovie);

                const movieId = movie.id;
                const mongoId = movie.mongoId;

                return (
                  <div
                    key={`${movie.mediaType}-${mongoId || movieId}`}
                    className="group/card relative w-[112px] shrink-0 snap-start sm:w-[145px] lg:w-[108px] 2xl:w-[115px]"
                  >
                    <Link
                      to={`/watch/${movie.mediaType}/${movieId}`}
                      draggable={false}
                      className="block cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-[#0B1020] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#8B5CF6] hover:shadow-lg hover:shadow-purple-500/10"
                    >
                      {/* POSTER */}

                      <div className="h-[125px] w-full overflow-hidden bg-[#111827] sm:h-[150px] lg:h-[135px] 2xl:h-[145px]">
                        {movie.poster ? (
                          <img
                            src={img(movie.poster)}
                            alt={movie.title}
                            loading="lazy"
                            draggable={false}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center p-2 text-center text-[10px] text-slate-400">
                            {movie.title}
                          </div>
                        )}
                      </div>

                      {/* MOVIE DETAILS */}

                      <div className="border-t border-white/10 px-2 py-2">
                        <p className="truncate text-[10px] font-bold text-white sm:text-xs">
                          {movie.title}
                        </p>

                        <p className="mt-1 text-[9px] text-slate-400 sm:text-[10px]">
                          {movie.year || "—"} ·{" "}
                          {movie.mediaType === "tv" ? "Series" : "Movie"}
                        </p>
                      </div>
                    </Link>

                    {/* REMOVE BUTTON */}

                    <button
                      type="button"
                      onClick={() => onRemove(listKey, movie)}
                      disabled={removingId === String(mongoId)}
                      aria-label={`Remove ${movie.title}`}
                      className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-[#080B14]/90 text-white opacity-100 transition hover:border-red-500 hover:bg-red-600 disabled:opacity-50 sm:opacity-0 sm:group-hover/card:opacity-100"
                    >
                      {removingId === String(mongoId) ? (
                        <LoaderCircle size={12} className="animate-spin" />
                      ) : (
                        <X size={12} />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* BOTTOM SLIDER */}

          {slider.overflow && (
            <div className="mx-auto mt-1.5 h-1 w-28 overflow-hidden rounded-full bg-white/10 sm:w-28 lg:w-28">
              <div
                className="h-full w-[35%] rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#A855F7]"
                style={{
                  transform: `translateX(${slider.progress * (100 / 35 - 1) * 100}%)`,
                }}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}

/* UPDATE PROFILE PANEL */

function UpdateProfilePanel({ onSaved, onClose }) {
  const fileRef = useRef(null);
  const imageFileRef = useRef(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [isGoogle, setIsGoogle] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fillForm = (data) => {
    setForm({
      name: data.name || "",
      email: data.email || "",
      phone: data.phone || "",
      fullName: data.address?.fullName || "",
      houseNo: data.address?.houseNo || "",
      area: data.address?.area || "",
      city: data.address?.city || "",
      state: data.address?.state || "",
      country: data.address?.country || "India",
      pincode: data.address?.pincode || "",
    });
  };

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await getUserProfile();
        const data = res?.data?.data;

        if (!active || !data) return;

        setIsGoogle(data.authProvider === "google");
        setImageUrl(getImageUrl(data.profileImage));
        fillForm(data);
      } catch (err) {
        if (active) {
          setError(
            err?.response?.data?.message || "Unable to load your profile.",
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

  useEffect(() => {
    return () => {
      if (imageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    const next =
      name === "phone" || name === "pincode" ? value.replace(/\D/g, "") : value;

    setForm((previous) => ({
      ...previous,
      [name]: next,
    }));

    setError("");
    setSuccess("");
  };

  const pickImage = (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please select a JPG, PNG, or WebP image.");
      input.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image must be under 2MB.");
      input.value = "";
      return;
    }

    imageFileRef.current = file;
    setImageFile(file);
    setRemoveImage(false);
    setImageUrl(URL.createObjectURL(file));
    setError("");
    setSuccess("");

    input.value = "";
  };

  const clearImage = () => {
    imageFileRef.current = null;
    setImageFile(null);
    setImageUrl("");
    setRemoveImage(true);
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const values = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()]),
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
      }),
    );

    const selectedImage = imageFileRef.current || imageFile;

    if (selectedImage) {
      formData.append("profileImage", selectedImage, selectedImage.name);
    }
    if (removeImage) {
      formData.append("removeImage", "true");
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await updateUserProfile(formData);
      const updated = res?.data?.data;

      if (updated) {
        saveUser({
          ...getUser(),
          ...updated,
        });

        window.dispatchEvent(new Event("auth-changed"));
        onSaved(updated);

        setImageUrl(getImageUrl(updated.profileImage));
        fillForm(updated);
      }

      imageFileRef.current = null;
      setImageFile(null);
      setRemoveImage(false);

      setSuccess(res?.data?.message || "Profile updated successfully.");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to update profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center rounded-xl py-10">
        <LoaderCircle className="h-7 w-7 animate-spin text-[#8B5CF6]" />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-4 rounded-xl border border-white/10 p-3 sm:p-4 lg:grid-cols-[160px_1fr] lg:gap-5 lg:p-5"
    >
      {/* Avatar + photo controls */}
      <div className="flex items-center gap-3 lg:flex-col lg:items-center lg:text-center">
        <div className="relative shrink-0">
          <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#22D3EE] text-xl font-bold text-white sm:h-20 sm:w-20 lg:h-24 lg:w-24 lg:rounded-2xl">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound className="h-1/2 w-1/2" />
            )}
          </span>

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Change photo"
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-[#080B14]/60 lg:rounded-2xl"
          >
            <Camera size={18} className="text-[#22D3EE] lg:text-[22px]" />
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={pickImage}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-xs font-bold text-[#22D3EE]"
          >
            Change photo
          </button>

          {imageUrl && (
            <button
              type="button"
              onClick={clearImage}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400"
            >
              <Trash2 size={12} />
              Remove photo
            </button>
          )}

          <p className="text-[10px] text-slate-500 lg:text-[11px]">
            JPG or PNG, up to 2MB
          </p>
        </div>
      </div>

      {/* Fields */}
      <div className="min-w-0">
        <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-[#8B5CF6] lg:mb-3 lg:text-sm">
          Personal details
        </h3>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:gap-3 xl:grid-cols-3">
          <Field
            label="Full name"
            name="name"
            value={form.name}
            onChange={handleChange}
            maxLength={50}
          />

          <Field
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            readOnly={isGoogle}
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
          />
        </div>

        <h3 className="mb-2.5 mt-4 text-xs font-bold uppercase tracking-wider text-[#22D3EE] lg:mb-3 lg:mt-6 lg:text-sm">
          Address details
        </h3>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:gap-3 xl:grid-cols-3">
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
          />
        </div>

        {error && (
          <p role="alert" className="mt-2.5 text-xs text-red-400">
            {error}
          </p>
        )}

        {success && (
          <p role="status" className="mt-2.5 text-xs text-[#22D3EE]">
            {success}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex h-9 items-center gap-2 rounded-md bg-[#8B5CF6] px-4 text-xs font-semibold text-white hover:bg-[#7C3AED] disabled:opacity-60 lg:h-10 lg:px-5"
          >
            {saving ? (
              <LoaderCircle size={13} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}

            {saving ? "Saving..." : "Save Changes"}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-9 items-center gap-1.5 rounded-md border border-white/20 px-3 text-xs font-semibold text-slate-300 hover:text-white lg:h-10 lg:px-4"
          >
            <X size={13} />
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

/* MAIN PROFILE PAGE */

export default function Profile() {
  const navigate = useNavigate();

  const accountRef = useRef(null);
  const panelRef = useRef(null);

  const [user, setUser] = useState(getUser());

  const [lists, setLists] = useState({
    liked: [],
    watchlist: [],
  });

  const [listsLoading, setListsLoading] = useState(true);
  const [listsSlow, setListsSlow] = useState(false);
  const [removingId, setRemovingId] = useState("");
  const [listError, setListError] = useState("");

  const [updateOpen, setUpdateOpen] = useState(false);
  const [panelMounted, setPanelMounted] = useState(false);

  const toggleUpdate = () => {
    if (updateOpen) {
      setUpdateOpen(false);
      return;
    }

    setPanelMounted(true);
    setUpdateOpen(true);
    // Only scroll to the panel on mobile — on desktop it is already in view
    if (window.innerWidth < 1024) {
      scrollToRef(panelRef, 150);
    }
  };

  const closeUpdate = () => {
    setUpdateOpen(false);
    scrollToRef(accountRef, 60);
  };

  const fetchLists = useCallback(async () => {
    if (!localStorage.getItem("userToken")) {
      navigate("/login", { replace: true });
      return;
    }

    setListsLoading(true);
    setListsSlow(false);
    setListError("");

    // Show "server waking up" hint after 8 s (Render free-tier cold start)
    const slowTimer = setTimeout(() => setListsSlow(true), 8000);

    try {
      const response = await getMovieLists();

      // getMovieLists now returns the full axios response
      const data = response?.data?.data ?? response?.data ?? response;

      if (!data || typeof data !== "object") {
        throw new Error("Invalid movie-list response.");
      }

      setLists({
        liked: Array.isArray(data.likelist)
          ? data.likelist.map(normalizeMovie)
          : [],

        watchlist: Array.isArray(data.watchlist)
          ? data.watchlist.map(normalizeMovie)
          : [],
      });
    } catch (err) {
      setListError(
        err?.code === "ECONNABORTED"
          ? "Server is taking too long to respond. It may be waking up — please retry in a moment."
          : err?.response?.data?.message ||
              err?.message ||
              "Unable to load your saved movies.",
      );

      if (err?.response?.status === 401) {
        logout();
        navigate("/login", { replace: true });
      }
    } finally {
      clearTimeout(slowTimer);
      setListsLoading(false);
      setListsSlow(false);
    }
  }, [navigate]);

  useEffect(() => {
    const syncUser = () => setUser(getUser());
    const syncLists = () => fetchLists();

    if (!localStorage.getItem("userToken")) {
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
    navigate("/", { replace: true });
  };

  const handleRemove = async (listKey, item) => {
    const mongoId = item.mongoId || item._id;

    if (!mongoId || removingId) {
      setListError("Unable to identify this saved movie.");
      return;
    }

    setRemovingId(String(mongoId));
    setListError("");

    try {
      await removeMovieFromList(LIST_TYPES[listKey], mongoId);

      setLists((previous) => ({
        ...previous,
        [listKey]: previous[listKey].filter(
          (movie) => String(movie.mongoId) !== String(mongoId),
        ),
      }));

      window.dispatchEvent(new Event("lists-changed"));
    } catch (err) {
      setListError(
        err?.response?.data?.message || "Unable to remove this movie.",
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

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#080B14] text-white">
      <Backdrop />

      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />

        <main className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-3 px-3 pb-6 pt-20 sm:gap-3.5 sm:px-5 sm:pt-24 lg:px-8 2xl:px-10">
          {listError && (
            <div
              role="alert"
              className="flex flex-col gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 sm:flex-row sm:items-center sm:justify-between"
            >
              <span>{listError}</span>

              <button
                type="button"
                onClick={fetchLists}
                className="font-bold text-[#22D3EE]"
              >
                Retry
              </button>
            </div>
          )}

          {/* MOVIE LISTS */}

          {listsLoading ? (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {[
                { title: "Liked Movies", icon: Heart },
                { title: "My Watchlist", icon: Bookmark },
              ].map(({ title, icon: Icon }) => (
                <section
                  key={title}
                  className="flex min-h-[190px] flex-col items-center justify-center gap-3 rounded-xl border border-white/10 bg-[#080B14]/40 p-4"
                >
                  <LoaderCircle className="h-7 w-7 animate-spin text-[#8B5CF6]" />

                  <div className="flex items-center gap-2">
                    <Icon size={16} className="text-[#D946EF]" />
                    <p className="text-sm font-semibold text-slate-300">
                      Loading {title}...
                    </p>
                  </div>

                  {listsSlow && (
                    <p className="text-center text-xs text-amber-400/80">
                      Server is waking up — this may take a moment…
                    </p>
                  )}

                  {!listsSlow && (
                    <p className="text-xs text-slate-500">
                      Please wait while we fetch your movies
                    </p>
                  )}
                </section>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2 xl:items-start">
              <MovieListSection
                title="Liked Movies"
                icon={Heart}
                movies={lists.liked}
                listKey="liked"
                removingId={removingId}
                onRemove={handleRemove}
              />

              <MovieListSection
                title="My Watchlist"
                icon={Bookmark}
                movies={lists.watchlist}
                listKey="watchlist"
                removingId={removingId}
                onRemove={handleRemove}
              />
            </div>
          )}

          {/* ACCOUNT & SECURITY */}

          <section
            ref={accountRef}
            className="scroll-mt-20 rounded-xl border border-white/10 bg-[#080B14]/35 p-3 transition-colors duration-300 hover:border-[#8B5CF6]/50 sm:p-3.5 lg:p-4"
          >
            <div className="mb-3 flex items-center gap-2">
              <LockKeyhole className="h-5 w-5 text-[#8B5CF6]" />

              <h2 className="text-sm font-bold uppercase tracking-wider text-[#8B5CF6] sm:text-base">
                Account &amp; Security
              </h2>

              <span className="h-px flex-1 bg-white/10" />
            </div>

            {/* Action tiles + panel grid
                Mobile:  [Update Profile] → [panel] → [Change Password] → [Sign Out]
                Desktop: [Update Profile | Change Password | Sign Out] then [panel spanning 3 cols]
            */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {/* 1 — Update Profile tile */}
              <div className="order-1">
                <ActionTile
                  icon={UserRound}
                  title="Update Profile"
                  text="Name, photo, phone & address"
                  expanded={updateOpen}
                  aria-expanded={updateOpen}
                  aria-controls="update-profile-panel"
                  onClick={toggleUpdate}
                />
              </div>

              {/* 2 — Panel: sits right under Update Profile on mobile, below all tiles on desktop */}
              <div
                id="update-profile-panel"
                ref={panelRef}
                className={`order-2 grid w-full transition-all duration-500 sm:order-4 sm:col-span-3 ${
                  updateOpen
                    ? "mt-1 grid-rows-[1fr] opacity-100 sm:mt-3"
                    : "mt-0 grid-rows-[0fr] opacity-0 pointer-events-none"
                }`}
              >
                <div className="min-h-0 overflow-hidden">
                  {panelMounted && (
                    <UpdateProfilePanel
                      onSaved={(updated) => {
                        setUser(getUser() || updated);
                        closeUpdate();
                      }}
                      onClose={closeUpdate}
                    />
                  )}
                </div>
              </div>

              {/* 3 — Change Password tile */}
              <div className="order-3 sm:order-2">
                <ActionTile
                  icon={LockKeyhole}
                  title="Change Password"
                  text="Update your sign-in password"
                  to="/change-password"
                  replace
                />
              </div>

              {/* 4 — Sign Out tile */}
              <div className="order-4 sm:order-3">
                <ActionTile
                  icon={LogOut}
                  title="Sign Out"
                  text="End your session"
                  danger
                  onClick={handleLogout}
                />
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
