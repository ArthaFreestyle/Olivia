"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ArrowRight, BarChart3, Leaf, MapPin, TrendingUp, Truck } from "lucide-react"
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useMobile } from "../app/hooks/use-mobile"

export default function Home() {
  const isMobile = useMobile()
  const [isLoaded, setIsLoaded] = useState(false)
  const heroRef = useRef(null)
  const featureRef = useRef(null)
  const quoteRef = useRef(null)
  const aboutRef = useRef(null)
  const contactRef = useRef(null)

  const heroInView = useInView(heroRef, { once: true, amount: 0.3 })
  const featureInView = useInView(featureRef, { once: true, amount: 0.3 })
  const quoteInView = useInView(quoteRef, { once: true, amount: 0.5 })
  const aboutInView = useInView(aboutRef, { once: true, amount: 0.3 })
  const contactInView = useInView(contactRef, { once: true, amount: 0.3 })

  const { scrollYProgress } = useScroll()
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -100])

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const cardHoverEffect = {
    rest: { scale: 1, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" },
    hover: {
      scale: 1.03,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: { duration: 0.3, ease: "easeOut" },
    },
  }

  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      <AnimatePresence>
        {isLoaded && (
          <motion.header
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          >
            <div className="container px-6 sm:px-8 md:px-4 max-w-6xl mx-auto flex h-16 items-center justify-between">
              <motion.div
                className="flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Leaf className="h-6 w-6 text-green-600" />
                <span className="text-xl font-bold">PanganMerata</span>
              </motion.div>
              <nav className="hidden md:flex gap-6">
                {["Beranda", "Fitur", "Tentang", "Kontak"].map((item, index) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.5 }}
                  >
                    <Link
                      href={`#${item.toLowerCase().replace(" ", "-")}`}
                      className="text-sm font-medium hover:text-green-600 transition-colors"
                    >
                      {item}
                    </Link>
                  </motion.div>
                ))}
              </nav>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button variant="outline" className="hidden md:flex">
                  Masuk
                </Button>
              </motion.div>
              <Button className="md:hidden" size="icon" variant="ghost">
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
                  className="h-6 w-6"
                >
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </Button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <main className="flex-1">
        <section
          ref={heroRef}
          className="relative w-full py-12 md:py-24 lg:py-32 overflow-hidden bg-gradient-to-b from-green-50 to-white"
        >
          <motion.div style={{ y: parallaxY }} className="absolute -z-10 top-0 left-0 w-full h-full opacity-30">
            <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-green-200 blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-64 h-64 rounded-full bg-green-300 blur-3xl"></div>
          </motion.div>

          <div className="container px-6 sm:px-8 md:px-10 max-w-6xl mx-auto">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <motion.div
                className="flex flex-col justify-center space-y-4"
                initial="hidden"
                animate={heroInView ? "visible" : "hidden"}
                variants={staggerContainer}
              >
                <motion.div className="space-y-2" variants={fadeInUp}>
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                    Pemerataan Distribusi untuk Ketahanan Pangan
                  </h1>
                  <p className="max-w-[600px] text-gray-500 md:text-xl">
                    Solusi inovatif untuk menjamin ketersediaan pangan melalui sistem distribusi yang merata dan efisien
                    di seluruh Indonesia.
                  </p>
                </motion.div>
                <motion.div className="flex flex-col sm:flex-row gap-2" variants={fadeInUp}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                      Mulai Sekarang
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="outline" className="w-full sm:w-auto">
                      Pelajari Lebih Lanjut
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.div>
              <motion.div
                className="flex items-center justify-center"
                initial={{ opacity: 0, x: 100 }}
                animate={heroInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <Image
                  whilehover={{ scale: 1.05, rotate: 1 }}
                  transition={{ duration: 0.5 }}
                  alt="Distribusi Pangan"
                  className="aspect-video overflow-hidden rounded-xl object-cover object-center shadow-xl"
                  height="310"
                  src="/images/vegetable.jpg"
                  width="550"
                />
              </motion.div>
            </div>
          </div>
        </section>

       <section ref={featureRef} id="fitur" className="w-full py-12 md:py-24 lg:py-32">
      <div className="container px-6 sm:px-8 md:px-10 max-w-6xl mx-auto gap-6">
        <motion.div
          className="flex flex-col items-center justify-center space-y-4 text-center"
          initial={{ opacity: 0, y: 50 }}
          animate={featureInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.6 }}
        >
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-green-100 px-3 py-1 text-sm text-green-600">Fitur Utama</div>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
              Solusi Komprehensif untuk Ketahanan Pangan
            </h2>
            <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Platform kami menyediakan alat analisis dan solusi logistik untuk memastikan distribusi pangan yang
              merata.
            </p>
          </div>
        </motion.div>
        {/* Increased gap from gap-6 to gap-12 for more spacing between cards */}
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-20 md:grid-cols-2 lg:grid-cols-2 mt-8">
          <motion.div initial="rest" animate="rest" whileHover="hover" variants={cardHoverEffect}>
            <Card className="h-full border-2 border-green-100 transition-all overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 10, 0] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, ease: "easeInOut" }}
                  >
                    <BarChart3 className="h-6 w-6 text-green-600" />
                  </motion.div>
                  <CardTitle>Analisis Tren Produksi Pangan</CardTitle>
                </div>
                <CardDescription>
                  Pantau dan analisis tren produksi pangan di berbagai wilayah Indonesia berdasarkan data historis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <motion.div
                  className="mb-4 overflow-hidden rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <img
                    alt="Grafik Tren Produksi Pangan"
                    className="aspect-video w-full object-cover object-center transition-transform"
                    height="180"
                    src="/images/analytic.png"
                    width="320"
                  />
                </motion.div>
                <div className="grid gap-4">
                  <motion.div className="flex items-start gap-4" whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                    <TrendingUp className="mt-1 h-5 w-5 text-green-500" />
                    <div>
                      <h3 className="font-medium">Identifikasi Tren Kuartalan</h3>
                      <p className="text-sm text-gray-500">
                        Lihat daerah mana saja yang mengalami peningkatan, penurunan, atau stabilitas produksi pangan di
                        kuartal ini
                      </p>
                    </div>
                  </motion.div>
                  <motion.div className="flex items-start gap-4" whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                    <BarChart3 className="mt-1 h-5 w-5 text-green-500" />
                    <div>
                      <h3 className="font-medium">Analisis Data Historis</h3>
                      <p className="text-sm text-gray-500">
                        Analisis berdasarkan data historis produksi pangan dari berbagai daerah
                      </p>
                    </div>
                  </motion.div>
                </div>
              </CardContent>
              <CardFooter>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full">
                  <Link href={"/analytics"}>
                    <Button variant="outline" className="w-full group">
                      Lihat Detail
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: "easeInOut" }}
                      >
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </motion.div>
                    </Button>
                  </Link>
                </motion.div>
              </CardFooter>
            </Card>
          </motion.div>

          <motion.div initial="rest" animate="rest" whileHover="hover" variants={cardHoverEffect}>
            <Card className="h-full border-2 border-green-100 transition-all overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2, ease: "easeInOut" }}
                  >
                    <Truck className="h-6 w-6 text-green-600" />
                  </motion.div>
                  <CardTitle>Logistik Freight Pooling</CardTitle>
                </div>
                <CardDescription>
                  Optimalkan distribusi pangan dengan sistem freight pooling yang efisien
                </CardDescription>
              </CardHeader>
              <CardContent>
                <motion.div
                  className="mb-4 overflow-hidden rounded-lg"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  <img
                    alt="Sistem Logistik Freight Pooling"
                    className="aspect-video w-full object-cover object-center transition-transform"
                    height="180"
                    src="/images/truck.jpg"
                    width="320"
                  />
                </motion.div>
                <div className="grid gap-4">
                  <motion.div className="flex items-start gap-4" whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                    <MapPin className="mt-1 h-5 w-5 text-green-500" />
                    <div>
                      <h3 className="font-medium">Rute Optimal</h3>
                      <p className="text-sm text-gray-500">
                        Penentuan rute distribusi optimal untuk meminimalkan waktu dan biaya
                      </p>
                    </div>
                  </motion.div>
                  <motion.div className="flex items-start gap-4" whileHover={{ x: 5 }} transition={{ duration: 0.2 }}>
                    <Truck className="mt-1 h-5 w-5 text-green-500" />
                    <div>
                      <h3 className="font-medium">Kolaborasi Transportasi</h3>
                      <p className="text-sm text-gray-500">
                        Sistem kolaborasi antar distributor untuk mengoptimalkan kapasitas angkut
                      </p>
                    </div>
                  </motion.div>
                </div>
              </CardContent>
              <CardFooter>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full">
                   <Link href={"https://oliviaaja-cxfuggcqe4f4fuac.canadacentral-01.azurewebsites.net/login"}>
                    <Button variant="outline" className="w-full group">
                      Lihat Detail
                      <motion.div
                        animate={{ x: [0, 5, 0] }}
                        transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5, ease: "easeInOut" }}
                      >
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </motion.div>
                    </Button>
                  </Link>
                </motion.div>
              </CardFooter>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>

        <section
          ref={quoteRef}
          className="w-full py-12 md:py-24 lg:py-32 bg-green-600 text-white relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 z-0"
            initial={{ opacity: 0 }}
            animate={quoteInView ? { opacity: 0.2 } : { opacity: 0 }}
            transition={{ duration: 1 }}
          >
            <div className="absolute top-0 left-0 w-full h-full">
              <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-white blur-3xl"></div>
              <div className="absolute bottom-20 right-10 w-64 h-64 rounded-full bg-white blur-3xl"></div>
            </div>
          </motion.div>

          <div className="container px-6 sm:px-8 md:px-10 max-w-6xl mx-auto relative z-10">
            <motion.div
              className="mx-auto max-w-3xl text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={quoteInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.8 }}
            >
              <motion.h2
                className="text-2xl sm:text-3xl font-bold tracking-tighter md:text-4xl/tight mb-6"
                animate={quoteInView ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              >
                Pernah nggak sih kalian mikir, sebenarnya sumber daya di dunia ini cukup banget buat semua orang? Bahkan, makanan yang kita buang setiap hari jumlahnya lebih banyak dari yang dibutuhkan untuk ngasih makan mereka yang kelaparan.
              </motion.h2>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  className="bg-transparent text-white border-white hover:bg-white hover:text-green-600"
                >
                  Pelajari Fakta Lainnya
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section ref={aboutRef} id="tentang" className="w-full py-12 md:py-24 lg:py-32 bg-green-50">
          <div className="container px-6 sm:px-8 md:px-10 max-w-6xl mx-auto">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <motion.div
                className="flex flex-col justify-center space-y-4"
                initial={{ opacity: 0, x: -50 }}
                animate={aboutInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
                transition={{ duration: 0.8 }}
              >
                <div className="space-y-2">
                  <div className="inline-block rounded-lg bg-green-100 px-3 py-1 text-sm text-green-600">
                    Tentang Kami
                  </div>
                  <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                    Misi Kami untuk Ketahanan Pangan
                  </h2>
                  <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    PanganMerata didirikan dengan visi untuk menciptakan sistem distribusi pangan yang adil dan merata
                    di seluruh Indonesia.
                  </p>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-500">
                    Kami percaya bahwa masalah ketahanan pangan bukan hanya tentang produksi, tetapi juga tentang
                    distribusi yang efektif. Dengan memanfaatkan teknologi dan data, kami membangun platform yang
                    menghubungkan produsen, distributor, dan konsumen dalam ekosistem yang terintegrasi.
                  </p>
                  
                </div>
              </motion.div>
              <motion.div
                className="flex items-center justify-center"
                initial={{ opacity: 0, x: 50 }}
                animate={aboutInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
                transition={{ duration: 0.8 }}
              >
                <motion.img
                  whileHover={{ scale: 1.05, rotate: 1 }}
                  transition={{ duration: 0.5 }}
                  alt="Tim PanganMerata"
                  className="aspect-video overflow-hidden rounded-xl object-cover object-center shadow-xl"
                  height="310"
                  src="/images/team.jpg"
                  width="550"
                />
              </motion.div>
            </div>
          </div>
        </section>

        <section ref={contactRef} id="kontak" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-6 sm:px-8 md:px-10 max-w-6xl mx-auto">
            <motion.div
              className="flex flex-col items-center justify-center space-y-4 text-center"
              initial={{ opacity: 0, y: 50 }}
              animate={contactInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.6 }}
            >
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-green-100 px-3 py-1 text-sm text-green-600">
                  Bergabunglah dengan Kami
                </div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">Jadilah Bagian dari Solusi</h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Bersama-sama kita dapat menciptakan sistem pangan yang lebih adil dan berkelanjutan.
                </p>
              </div>
            </motion.div>
            <motion.div
              className="mx-auto max-w-md space-y-4 mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={contactInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="w-full bg-green-600 hover:bg-green-700">Daftar Sekarang</Button>
              </motion.div>
              <motion.p
                className="text-center text-sm text-gray-500"
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              >
                Atau hubungi kami di{" "}
                <a href="mailto:info@panganmerata.id" className="text-green-600 hover:underline">
                  info@panganmerata.id
                </a>
              </motion.p>
            </motion.div>
          </div>
        </section>
      </main>
      <motion.footer
        className="w-full border-t py-6 md:py-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="container px-6 sm:px-8 md:px-10 max-w-6xl mx-auto flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
            <Leaf className="h-5 w-5 text-green-600" />
            <p className="text-sm text-gray-500">© 2025 PanganMerata. Hak Cipta Dilindungi.</p>
          </motion.div>
          <div className="flex gap-4">
            <motion.div whileHover={{ scale: 1.1, y: -2 }} transition={{ duration: 0.2 }}>
              <Link href="#" className="text-sm text-gray-500 hover:text-green-600">
                Kebijakan Privasi
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1, y: -2 }} transition={{ duration: 0.2 }}>
              <Link href="#" className="text-sm text-gray-500 hover:text-green-600">
                Syarat dan Ketentuan
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.footer>
    </div>
  )
}
