'use client'

import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { decodeEntities } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/security";
import Link from "next/link";
import Image from "next/image";
import { 
  Loader2, 
  Search, 
  ShoppingBag, 
  FileText, 
  Sparkles, 
  BookOpen, 
  Smile, 
  Video, 
  BarChart2, 
  Quote, 
  ArrowRight,
  ChevronRight,
  Play,
  Calendar,
  Layers,
  HelpCircle,
  BookMarked
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ProductCard } from "@/components/ProductCard";
import { allGuides } from "../guides/page";

type SearchTab = 'all' | 'products' | 'articles' | 'remedies' | 'studies' | 'recipes' | 'anecdotes' | 'guides' | 'videos' | 'memes' | 'charts';

interface TabItem {
  id: SearchTab;
  label: string;
  icon: React.ReactNode;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams?.get("q") || "";
  
  const [query, setQuery] = useState(initialQ);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  
  const [results, setResults] = useState<{
    products: any[];
    articles: any[];
    remedies: any[];
    studies: any[];
    recipes: any[];
    anecdotes: any[];
    guides: any[];
    videos: any[];
    memes: any[];
    charts: any[];
  }>({
    products: [],
    articles: [],
    remedies: [],
    studies: [],
    recipes: [],
    anecdotes: [],
    guides: [],
    videos: [],
    memes: [],
    charts: [],
  });

  const [selectedGallery, setSelectedGallery] = useState<any | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<any>(null);

  // Sync initial query from URL param changes (e.g. if header search triggers new navigation)
  useEffect(() => {
    if (initialQ !== query) {
      setQuery(initialQ);
    }
  }, [initialQ]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults({
        products: [],
        articles: [],
        remedies: [],
        studies: [],
        recipes: [],
        anecdotes: [],
        guides: [],
        videos: [],
        memes: [],
        charts: [],
      });
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setSearched(true);

      const cleanQuery = query.trim().replace(/[,()]/g, " ");

      try {
        const [
          productsRes, 
          articlesRes, 
          recipesRes, 
          videosRes, 
          galleriesRes
        ] = await Promise.all([
          // 1. Search products (across title, excerpt, content, category)
          supabase
            .from("products")
            .select("*, vendor_profiles!inner(id, store_name, store_logo_url, is_approved, is_live)")
            .or(`title.ilike.%${cleanQuery}%,excerpt.ilike.%${cleanQuery}%,content.ilike.%${cleanQuery}%,category.ilike.%${cleanQuery}%`)
            .eq("status", "published")
            .eq("vendor_profiles.is_approved", true)
            .eq("vendor_profiles.is_live", true)
            .limit(40),

          // 2. Search articles (across title, excerpt, content, category_name)
          supabase
            .from("articles")
            .select("*")
            .or(`title.ilike.%${cleanQuery}%,excerpt.ilike.%${cleanQuery}%,content.ilike.%${cleanQuery}%,category_name.ilike.%${cleanQuery}%`)
            .limit(60),

          // 3. Search recipes (across title, excerpt, content)
          supabase
            .from("recipes")
            .select("*")
            .or(`title.ilike.%${cleanQuery}%,excerpt.ilike.%${cleanQuery}%,content.ilike.%${cleanQuery}%`)
            .limit(30),

          // 4. Search videos (across title, description)
          supabase
            .from("videos")
            .select("*, profiles(role)")
            .or(`title.ilike.%${cleanQuery}%,description.ilike.%${cleanQuery}%`)
            .limit(30),

          // 5. Search galleries for memes & charts (across title, category)
          supabase
            .from("galleries")
            .select("*, gallery_items(*)")
            .or(`title.ilike.%${cleanQuery}%,category.ilike.%${cleanQuery}%`)
            .limit(30),
        ]);

        // Process Products
        const productsList = productsRes.data || [];

        // Process Articles & subcategories (remedies, studies, anecdotes)
        const rawArticles = articlesRes.data || [];
        const studiesList: any[] = [];
        const remediesList: any[] = [];
        const anecdotesList: any[] = [];
        const generalArticlesList: any[] = [];

        rawArticles.forEach((article) => {
          const categoryLower = article.category_name?.toLowerCase() || "";
          if (categoryLower === "studies") {
            studiesList.push(article);
          } else if (categoryLower === "natural remedies" || categoryLower === "natural-remedies") {
            remediesList.push(article);
          } else if (categoryLower === "anecdotes") {
            anecdotesList.push(article);
          } else {
            generalArticlesList.push(article);
          }
        });

        // Process Recipes
        const recipesList = recipesRes.data || [];

        // Process Videos (filter by featured/admin author in JS to match catalog rule)
        const rawVideos = videosRes.data || [];
        const videosList = rawVideos.filter(
          (v: any) => v.is_featured === true || v.profiles?.role === "admin"
        );

        // Process Guides (Search static config in JS)
        const cleanLower = cleanQuery.toLowerCase();
        const matchedGuides = allGuides.filter((guide: any) => {
          return (
            guide.title?.toLowerCase().includes(cleanLower) ||
            guide.description?.toLowerCase().includes(cleanLower) ||
            guide.category?.toLowerCase().includes(cleanLower)
          );
        });

        // Process Galleries (Memes & Charts)
        const rawGalleries = galleriesRes.data || [];
        const memesList: any[] = [];
        const chartsList: any[] = [];

        rawGalleries.forEach((gallery) => {
          const categoryLower = gallery.category?.toLowerCase() || "";
          if (categoryLower === "memes") {
            memesList.push(gallery);
          } else if (categoryLower === "charts") {
            chartsList.push(gallery);
          }
        });

        setResults({
          products: productsList,
          articles: generalArticlesList,
          remedies: remediesList,
          studies: studiesList,
          recipes: recipesList,
          anecdotes: anecdotesList,
          guides: matchedGuides,
          videos: videosList,
          memes: memesList,
          charts: chartsList,
        });

      } catch (error) {
        console.error("Search query execution failed:", error);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const counts = {
    products: results.products.length,
    articles: results.articles.length,
    remedies: results.remedies.length,
    studies: results.studies.length,
    recipes: results.recipes.length,
    anecdotes: results.anecdotes.length,
    guides: results.guides.length,
    videos: results.videos.length,
    memes: results.memes.length,
    charts: results.charts.length,
  };

  const totalResults = Object.values(counts).reduce((a, b) => a + b, 0);

  const tabs: TabItem[] = [
    { id: "all", label: "All Results", icon: <Layers className="h-4 w-4" /> },
    { id: "products", label: `Products (${counts.products})`, icon: <ShoppingBag className="h-4 w-4" /> },
    { id: "articles", label: `Articles (${counts.articles})`, icon: <FileText className="h-4 w-4" /> },
    { id: "remedies", label: `Remedies (${counts.remedies})`, icon: <Sparkles className="h-4 w-4" /> },
    { id: "studies", label: `Studies (${counts.studies})`, icon: <BookMarked className="h-4 w-4" /> },
    { id: "recipes", label: `Recipes (${counts.recipes})`, icon: <BookOpen className="h-4 w-4" /> },
    { id: "anecdotes", label: `Anecdotes (${counts.anecdotes})`, icon: <Smile className="h-4 w-4" /> },
    { id: "guides", label: `Guides (${counts.guides})`, icon: <BookOpen className="h-4 w-4" /> },
    { id: "videos", label: `Videos (${counts.videos})`, icon: <Video className="h-4 w-4" /> },
    { id: "memes", label: `Memes (${counts.memes})`, icon: <Smile className="h-4 w-4" /> },
    { id: "charts", label: `Charts (${counts.charts})`, icon: <BarChart2 className="h-4 w-4" /> },
  ];

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-wellness-muted/50 to-background border-b border-border py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl text-balance">
            Search the Gateway
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Search products, articles, scientific studies, natural remedies, recipes, videos, memes, and buying guides.
          </p>

          {/* Search Input Bar */}
          <div className="mx-auto mt-8 max-w-2xl relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              ref={inputRef}
              type="search"
              placeholder="Type to search anything on the Gateway..."
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              className="pl-12 pr-12 h-14 text-lg bg-card border-2 border-border/80 rounded-2xl shadow-lg focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
            />
            {loading && (
              <div className="absolute inset-y-0 right-4 flex items-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </div>

          {/* Result Count Banner */}
          {searched && !loading && (
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              {totalResults === 0
                ? `No results for "${query}"`
                : `Found ${totalResults} result${totalResults !== 1 ? "s" : ""} matching "${query}"`}
            </p>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {searched && !loading && totalResults > 0 && (
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Navigation for Desktop */}
            <aside className="w-full lg:w-64 shrink-0">
              <div className="sticky top-20 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible no-scrollbar pb-3 lg:pb-0 border-b lg:border-b-0 border-border">
                {tabs.map((tab) => {
                  const countKey = tab.id as keyof typeof counts;
                  const count = countKey === "all" ? totalResults : counts[countKey];
                  const hasResults = count > 0 || tab.id === "all";

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      disabled={!hasResults}
                      className={`flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all whitespace-nowrap lg:w-full shrink-0 ${
                        activeTab === tab.id
                          ? "bg-primary text-white shadow-md shadow-primary/10"
                          : hasResults
                          ? "text-foreground hover:bg-accent/50 hover:text-primary"
                          : "text-muted-foreground/45 cursor-not-allowed"
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label.split(" ")[0]}</span>
                      {tab.id !== "all" && (
                        <Badge 
                          variant={activeTab === tab.id ? "secondary" : "outline"}
                          className={`ml-auto font-black text-[10px] ${!hasResults ? "opacity-30" : ""}`}
                        >
                          {count}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Results Display */}
            <main className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-12"
                >
                  {/* ALL RESULTS TAB */}
                  {activeTab === "all" && (
                    <>
                      {/* Products */}
                      {counts.products > 0 && (
                        <section className="border-b border-border/50 pb-8 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                              <ShoppingBag className="h-5 w-5 text-primary" /> Products
                            </h2>
                            {counts.products > 6 && (
                              <button onClick={() => setActiveTab("products")} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                View all {counts.products} <ChevronRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {results.products.slice(0, 6).map((product) => (
                              <ProductCard key={product.id} product={product} />
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Articles */}
                      {counts.articles > 0 && (
                        <section className="border-b border-border/50 pb-8 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                              <FileText className="h-5 w-5 text-primary" /> Articles & References
                            </h2>
                            {counts.articles > 6 && (
                              <button onClick={() => setActiveTab("articles")} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                View all {counts.articles} <ChevronRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            {results.articles.slice(0, 6).map((article) => (
                              <ArticleRow key={article.id} article={article} />
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Remedies */}
                      {counts.remedies > 0 && (
                        <section className="border-b border-border/50 pb-8 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                              <Sparkles className="h-5 w-5 text-emerald-500" /> Natural Remedies
                            </h2>
                            {counts.remedies > 6 && (
                              <button onClick={() => setActiveTab("remedies")} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                View all {counts.remedies} <ChevronRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            {results.remedies.slice(0, 6).map((article) => (
                              <ArticleRow key={article.id} article={article} basePath="articles" />
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Studies */}
                      {counts.studies > 0 && (
                        <section className="border-b border-border/50 pb-8 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                              <BookMarked className="h-5 w-5 text-blue-500" /> Scientific Studies
                            </h2>
                            {counts.studies > 6 && (
                              <button onClick={() => setActiveTab("studies")} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                View all {counts.studies} <ChevronRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            {results.studies.slice(0, 6).map((article) => (
                              <ArticleRow key={article.id} article={article} basePath="articles" />
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Recipes */}
                      {counts.recipes > 0 && (
                        <section className="border-b border-border/50 pb-8 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                              <BookOpen className="h-5 w-5 text-orange-500" /> Recipes
                            </h2>
                            {counts.recipes > 6 && (
                              <button onClick={() => setActiveTab("recipes")} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                View all {counts.recipes} <ChevronRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            {results.recipes.slice(0, 6).map((recipe) => (
                              <RecipeRow key={recipe.id} recipe={recipe} />
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Anecdotes */}
                      {counts.anecdotes > 0 && (
                        <section className="border-b border-border/50 pb-8 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                              <Smile className="h-5 w-5 text-purple-500" /> Wellness Anecdotes
                            </h2>
                            {counts.anecdotes > 6 && (
                              <button onClick={() => setActiveTab("anecdotes")} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                View all {counts.anecdotes} <ChevronRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <div className="grid gap-6 md:grid-cols-2">
                            {results.anecdotes.slice(0, 6).map((anecdote) => (
                              <AnecdoteCard key={anecdote.id} anecdote={anecdote} />
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Guides */}
                      {counts.guides > 0 && (
                        <section className="border-b border-border/50 pb-8 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                              <BookOpen className="h-5 w-5 text-teal-600" /> Buying Guides
                            </h2>
                            {counts.guides > 6 && (
                              <button onClick={() => setActiveTab("guides")} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                View all {counts.guides} <ChevronRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            {results.guides.slice(0, 6).map((guide) => (
                              <GuideRow key={guide.slug} guide={guide} />
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Videos */}
                      {counts.videos > 0 && (
                        <section className="border-b border-border/50 pb-8 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                              <Video className="h-5 w-5 text-rose-500" /> Videos
                            </h2>
                            {counts.videos > 6 && (
                              <button onClick={() => setActiveTab("videos")} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                View all {counts.videos} <ChevronRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            {results.videos.slice(0, 6).map((vid) => (
                              <VideoRow key={vid.id} vid={vid} />
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Memes */}
                      {counts.memes > 0 && (
                        <section className="border-b border-border/50 pb-8 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                              <Smile className="h-5 w-5 text-yellow-600" /> Memes & Inspiration
                            </h2>
                            {counts.memes > 6 && (
                              <button onClick={() => setActiveTab("memes")} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                View all {counts.memes} <ChevronRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                            {results.memes.slice(0, 6).map((meme) => (
                              <GalleryCard key={meme.id} gallery={meme} onSelect={setSelectedGallery} />
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Charts */}
                      {counts.charts > 0 && (
                        <section className="border-b border-border/50 pb-8 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                              <BarChart2 className="h-5 w-5 text-indigo-500" /> Interactive Charts
                            </h2>
                            {counts.charts > 6 && (
                              <button onClick={() => setActiveTab("charts")} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                                View all {counts.charts} <ChevronRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
                            {results.charts.slice(0, 6).map((chart) => (
                              <GalleryCard key={chart.id} gallery={chart} onSelect={setSelectedGallery} />
                            ))}
                          </div>
                        </section>
                      )}
                    </>
                  )}

                  {/* PRODUCTS TAB */}
                  {activeTab === "products" && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                      {results.products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  )}

                  {/* ARTICLES TAB */}
                  {activeTab === "articles" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {results.articles.map((article) => (
                        <ArticleRow key={article.id} article={article} />
                      ))}
                    </div>
                  )}

                  {/* REMEDIES TAB */}
                  {activeTab === "remedies" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {results.remedies.map((article) => (
                        <ArticleRow key={article.id} article={article} basePath="articles" />
                      ))}
                    </div>
                  )}

                  {/* STUDIES TAB */}
                  {activeTab === "studies" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {results.studies.map((article) => (
                        <ArticleRow key={article.id} article={article} basePath="articles" />
                      ))}
                    </div>
                  )}

                  {/* RECIPES TAB */}
                  {activeTab === "recipes" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {results.recipes.map((recipe) => (
                        <RecipeRow key={recipe.id} recipe={recipe} />
                      ))}
                    </div>
                  )}

                  {/* ANECDOTES TAB */}
                  {activeTab === "anecdotes" && (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {results.anecdotes.map((anecdote) => (
                        <AnecdoteCard key={anecdote.id} anecdote={anecdote} />
                      ))}
                    </div>
                  )}

                  {/* GUIDES TAB */}
                  {activeTab === "guides" && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {results.guides.map((guide) => (
                        <GuideRow key={guide.slug} guide={guide} />
                      ))}
                    </div>
                  )}

                  {/* VIDEOS TAB */}
                  {activeTab === "videos" && (
                    <div className="grid gap-6 sm:grid-cols-2">
                      {results.videos.map((vid) => (
                        <VideoRow key={vid.id} vid={vid} />
                      ))}
                    </div>
                  )}

                  {/* MEMES TAB */}
                  {activeTab === "memes" && (
                    <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                      {results.memes.map((meme) => (
                        <GalleryCard key={meme.id} gallery={meme} onSelect={setSelectedGallery} />
                      ))}
                    </div>
                  )}

                  {/* CHARTS TAB */}
                  {activeTab === "charts" && (
                    <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                      {results.charts.map((chart) => (
                        <GalleryCard key={chart.id} gallery={chart} onSelect={setSelectedGallery} />
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        )}

        {/* Start / Empty State */}
        {!searched && !loading && (
          <div className="mt-16 text-center py-20 bg-card/40 rounded-3xl border border-dashed border-border/80 max-w-xl mx-auto px-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-wellness-muted text-primary shadow-inner">
              <Search className="h-7 w-7" />
            </div>
            <h2 className="mt-6 text-xl font-bold text-foreground">Find Wellness Content</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Start typing to search products, recipes, scientific studies, memes, and remedies.
            </p>
          </div>
        )}

        {/* No Results State */}
        {searched && !loading && totalResults === 0 && (
          <div className="mt-16 text-center py-20 bg-card/40 rounded-3xl border border-dashed border-border/80 max-w-xl mx-auto px-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/5 text-destructive border border-destructive/10">
              <HelpCircle className="h-7 w-7" />
            </div>
            <h2 className="mt-6 text-xl font-bold text-foreground">No matches found</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              We couldn't find anything matching &ldquo;{query}&rdquo;. Check your spelling, try different keywords, or check our shop.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button 
                onClick={() => setQuery("")}
                className="px-4 py-2 text-sm font-bold rounded-lg border border-border hover:bg-accent transition-colors"
              >
                Clear Search
              </button>
              <Link 
                href="/products"
                className="px-4 py-2 text-sm font-bold rounded-lg bg-primary text-white shadow-lg shadow-primary/10 hover:opacity-90 transition-opacity"
              >
                Browse Marketplace
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox for Gallery categories */}
      <Dialog open={!!selectedGallery} onOpenChange={(open) => !open && setSelectedGallery(null)}>
        <DialogContent className="max-w-4xl p-6 bg-card border border-border rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh] sm:rounded-2xl">
          {selectedGallery && (
            <div>
              <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
                <div>
                  <h3 className="text-2xl font-black text-foreground capitalize">{selectedGallery.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedGallery.gallery_items.length} image{selectedGallery.gallery_items.length !== 1 ? "s" : ""} in this collection
                  </p>
                </div>
                <Link
                  href={selectedGallery.category === 'memes' ? '/memes' : '/charts'}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  onClick={() => setSelectedGallery(null)}
                >
                  View full page <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {selectedGallery.gallery_items && selectedGallery.gallery_items.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {selectedGallery.gallery_items.map((item: any) => (
                    <div
                      key={item.id}
                      className="relative aspect-square rounded-xl overflow-hidden border border-border group cursor-zoom-in bg-muted shadow-sm transition-all hover:shadow-md"
                      onClick={() => setSelectedImage(item.image_url)}
                    >
                      <Image
                        src={item.image_url}
                        alt={selectedGallery.title}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Eye className="h-6 w-6 text-white drop-shadow-md" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  No images in this collection yet.
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lightbox for single image zoom */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-1 bg-black/95 border-none shadow-none flex items-center justify-center rounded-2xl overflow-hidden">
          {selectedImage && (
            <div className="relative w-full h-[80vh] flex items-center justify-center p-2">
              <img 
                src={selectedImage} 
                alt="Zoomed media" 
                className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" 
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* SUB-COMPONENTS FOR DISPLAY */

// General Article display card
function ArticleRow({ article, basePath = "articles" }: { article: any; basePath?: string }) {
  return (
    <Link
      href={`/${basePath}/${article.slug}`}
      className="group flex gap-4 rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 h-full"
    >
      {article.image_url && (
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted border border-border/50">
          <Image
            src={article.image_url}
            alt={article.title || ""}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="80px"
          />
        </div>
      )}
      <div className="min-w-0 flex flex-col justify-center flex-1">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          {article.category_name && (
            <Badge variant="secondary" className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5">
              {article.category_name}
            </Badge>
          )}
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(article.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>
        <h3 className="text-sm font-bold text-foreground group-hover:text-primary line-clamp-1 transition-colors leading-snug">
          {decodeEntities(article.title || "")}
        </h3>
        {article.excerpt && (
          <p
            className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.excerpt) }}
          />
        )}
      </div>
    </Link>
  );
}

// Recipe display card
function RecipeRow({ recipe }: { recipe: any }) {
  const prep = recipe.prep_time || 0;
  const cook = recipe.cook_time || 0;
  const total = prep + cook;

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="group flex gap-4 rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 h-full"
    >
      {recipe.image_url && (
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted border border-border/50">
          <Image
            src={recipe.image_url}
            alt={recipe.title || ""}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="80px"
          />
        </div>
      )}
      <div className="min-w-0 flex flex-col justify-center flex-1">
        <div className="flex items-center gap-2 mb-1.5">
          <Badge variant="outline" className="text-[9px] border-orange-200 text-orange-600 bg-orange-500/5 uppercase font-bold tracking-wider px-1.5 py-0.5">
            Recipe
          </Badge>
          {total > 0 && (
            <span className="text-[10px] text-muted-foreground font-medium">
              ⏱️ {total} mins
            </span>
          )}
        </div>
        <h3 className="text-sm font-bold text-foreground group-hover:text-primary line-clamp-1 transition-colors leading-snug">
          {decodeEntities(recipe.title || "")}
        </h3>
        {recipe.excerpt && (
          <p
            className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(recipe.excerpt) }}
          />
        )}
      </div>
    </Link>
  );
}

// Anecdote Display Card
function AnecdoteCard({ anecdote }: { anecdote: any }) {
  // Helper to strip tags and entities
  const getCleanText = (html: string) => {
    if (!html) return "";
    const stripped = html.replace(/<[^>]*>/g, " ");
    return decodeEntities(stripped).replace(/\s+/g, " ").trim();
  };

  const cleanText = getCleanText(anecdote.excerpt || anecdote.content || "");
  const excerptText = cleanText.length > 140 ? cleanText.slice(0, 140) + "..." : cleanText;

  return (
    <Link
      href={`/articles/${anecdote.slug}`}
      className="group block relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
    >
      <div className="absolute top-4 right-6 opacity-5 transition-opacity group-hover:opacity-10">
        <Quote className="h-10 w-10 text-primary" />
      </div>

      <div className="relative z-10">
        <p className="text-sm font-medium leading-relaxed text-foreground italic mb-4">
          &ldquo;{excerptText}&rdquo;
        </p>

        <div className="flex items-center gap-3 pt-4 border-t border-border/50">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
            {anecdote.title?.charAt(0).toUpperCase() || "A"}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
              {decodeEntities(anecdote.title || "")}
            </h4>
            <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
              {new Date(anecdote.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Guide display card
function GuideRow({ guide }: { guide: any }) {
  return (
    <Link
      href={`/guides/${guide.slug}`}
      className="group flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 h-full"
    >
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl" role="img" aria-label="guide icon">{guide.icon}</span>
          <Badge variant="outline" className="text-[9px] border-teal-200 text-teal-600 bg-teal-500/5 uppercase font-bold tracking-wider px-1.5 py-0.5">
            {guide.category}
          </Badge>
        </div>
        <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
          {guide.title}
        </h3>
        <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {guide.description}
        </p>
      </div>
      <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground font-medium">
        <span>{guide.readTime}</span>
        <span className="flex items-center gap-0.5 text-primary font-bold group-hover:gap-1.5 transition-all">
          Read Guide <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

// Video display card
function VideoRow({ vid }: { vid: any }) {
  const videoId = vid.embed_url?.split("/").pop() || "";
  const thumbnail = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

  return (
    <Link
      href="/videos"
      className="group block rounded-2xl border border-border/80 bg-card p-4 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 h-full"
    >
      <div className="relative aspect-video overflow-hidden rounded-xl bg-black border border-border/50">
        <Image
          src={thumbnail}
          alt={vid.title || ""}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-103"
          sizes="(max-width: 640px) 100vw, 50vw"
        />
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center group-hover:bg-black/30 transition-colors">
          <div className="h-10 w-10 rounded-full bg-white/90 shadow-md flex items-center justify-center text-primary transform scale-90 group-hover:scale-100 transition-all duration-300">
            <Play className="h-5 w-5 fill-primary ml-0.5" />
          </div>
        </div>
      </div>
      <h3 className="mt-3 text-sm font-bold text-foreground group-hover:text-primary line-clamp-1 transition-colors leading-snug">
        {decodeEntities(vid.title || "")}
      </h3>
      {vid.description && (
        <p className="mt-1 text-xs text-muted-foreground line-clamp-1 leading-normal">
          {vid.description}
        </p>
      )}
    </Link>
  );
}

// Gallery (Memes/Charts) Display Card
function GalleryCard({ gallery, onSelect }: { gallery: any; onSelect: (g: any) => void }) {
  const coverImage = gallery.gallery_items?.[0]?.image_url;

  return (
    <div
      onClick={() => onSelect(gallery)}
      className="group cursor-pointer rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm hover:shadow-lg hover:border-primary/20 transition-all h-full"
    >
      <div className="aspect-[4/3] relative overflow-hidden bg-muted border-b border-border/50">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={gallery.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-accent/20">
            <Layers className="h-8 w-8 text-muted-foreground/30 animate-pulse" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-3.5">
          <span className="text-[9px] font-black uppercase text-primary bg-white/95 px-1.5 py-0.5 rounded-sm w-fit tracking-wider shadow-sm mb-1">
            {gallery.category}
          </span>
          <h3 className="text-sm font-black text-white leading-tight truncate">
            {gallery.title}
          </h3>
          <p className="text-white/80 text-[10px] font-bold mt-0.5">
            {gallery.gallery_items?.length || 0} items
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
