"use client";
import { MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export function FloatingWhatsApp() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const whatsappUrl = "https://wa.me/5511983680393?text=Olá! Estava navegando no site VanGuardian e gostaria de saber mais sobre a solução.";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ scale: 0, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="fixed bottom-32 sm:bottom-6 right-6 z-[100] flex items-center justify-center w-16 h-16 bg-[#25D366] text-white rounded-full shadow-2xl hover:bg-[#20ba59] transition-all border-4 border-white/20"
          aria-label="Falar no WhatsApp"
        >
          <MessageSquare className="w-8 h-8 fill-current" />
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1 }}
            className="hidden sm:block absolute right-20 bg-white text-zinc-900 px-4 py-2 rounded-xl shadow-xl border border-zinc-100 whitespace-nowrap font-bold text-sm pointer-events-none"
          >
            Dúvidas? Fale conosco!
            <div className="absolute top-1/2 -right-2 -translate-y-1/2 border-8 border-transparent border-l-white" />
          </motion.div>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
