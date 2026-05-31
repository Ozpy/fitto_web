import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Icons from 'lucide-react'
import { Question } from '@/types/onboarding'
import { IconResolver } from './SingleSelectCards'

type Props = {
  question: Question
  value: string[] | null
  onChange: (value: string[]) => void
}

export default function MultiSelectIcons({ question, value = [], onChange }: Props) {
  const options = question.options || []
  const currentSelections = value || []

  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const toggleSelection = (val: string) => {
    if (currentSelections.includes(val)) {
      onChange(currentSelections.filter((item) => item !== val))
    } else {
      onChange([...currentSelections, val])
    }
  }

  // Preset handlers for q_equipment
  const applyPreset = (presetName: string) => {
    if (presetName === 'home') {
      const homeSlugs = ['bodyweight', 'bands', 'mat', 'dumbbell', 'dumbbells']
      const matched = options.filter((o) => homeSlugs.includes(o.value)).map((o) => o.value)
      onChange(matched)
    } else if (presetName === 'calisthenics') {
      const caliSlugs = ['bodyweight', 'bands', 'rings', 'pullup_bar']
      const matched = options.filter((o) => caliSlugs.includes(o.value)).map((o) => o.value)
      onChange(matched)
    } else if (presetName === 'gym') {
      onChange(options.map((o) => o.value))
    }
  }

  const isEquipment = question.slug === 'q_equipment' || question.slug.includes('equipment')

  // Helper to filter options by tab
  const getTabFilteredOptions = (tab: string) => {
    return options.filter((option) => {
      if (tab === 'all') return true
      if (tab === 'home') {
        return (
          option.category === 'home' ||
          option.category === 'mixed' ||
          ['bodyweight', 'bands', 'dumbbells', 'kettlebell'].includes(option.value)
        )
      }
      if (tab === 'gym') {
        return (
          option.category === 'gym' ||
          option.category === 'mixed' ||
          ['barbell', 'cable', 'machine', 'bench'].includes(option.value)
        )
      }
      if (tab === 'cardio') {
        return (
          option.value.includes('cardio') ||
          option.value.includes('bike') ||
          option.value.includes('treadmill') ||
          option.value.includes('elliptical') ||
          option.value.includes('rowing') ||
          option.value.includes('rope')
        )
      }
      if (tab === 'essentials') {
        return ['bodyweight', 'bands', 'dumbbells', 'pullup_bar', 'kettlebell'].includes(option.value)
      }
      return true
    })
  }

  // Precompute tab option counts for UX badges
  const tabCounts = useMemo(() => {
    return {
      all: options.length,
      home: getTabFilteredOptions('home').length,
      gym: getTabFilteredOptions('gym').length,
      cardio: getTabFilteredOptions('cardio').length,
      essentials: getTabFilteredOptions('essentials').length,
    }
  }, [options])

  // Get final filtered list of options based on active tab and search query
  const filteredOptions = useMemo(() => {
    const tabList = getTabFilteredOptions(activeTab)
    if (!searchQuery.trim()) return tabList
    const query = searchQuery.toLowerCase()
    return tabList.filter(
      (opt) =>
        opt.label.toLowerCase().includes(query) ||
        (opt.description && opt.description.toLowerCase().includes(query))
    )
  }, [activeTab, searchQuery, options])

  const handleResetFilters = () => {
    setSearchQuery('')
    setActiveTab('all')
  }

  const tabs = [
    { id: 'all', label: '✨ Todos', count: tabCounts.all },
    { id: 'home', label: '🏠 En Casa', count: tabCounts.home },
    { id: 'gym', label: '🏋️ Gimnasio', count: tabCounts.gym },
    { id: 'essentials', label: '⚡ Esenciales', count: tabCounts.essentials },
    { id: 'cardio', label: '🏃 Cardio', count: tabCounts.cardio },
  ]

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* 1. Header Toolbar (Presets + Search) */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-card/40 border border-border/40 p-4 rounded-3xl backdrop-blur-sm shadow-inner shadow-black/5">
        
        {/* Presets */}
        {isEquipment && (
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs font-bold text-muted-foreground mr-1 uppercase tracking-wider">Presets rápidos:</span>
            <button
              type="button"
              onClick={() => applyPreset('home')}
              className="px-3.5 py-1.5 rounded-full border border-border bg-card/60 text-xs font-bold text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-1 cursor-pointer"
            >
              🏠 Solo casa
            </button>
            <button
              type="button"
              onClick={() => applyPreset('calisthenics')}
              className="px-3.5 py-1.5 rounded-full border border-border bg-card/60 text-xs font-bold text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-1 cursor-pointer"
            >
              🤸 Calistenia
            </button>
            <button
              type="button"
              onClick={() => applyPreset('gym')}
              className="px-3.5 py-1.5 rounded-full border border-border bg-card/60 text-xs font-bold text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-1 cursor-pointer"
            >
              🏋️ Gym completo
            </button>
          </div>
        )}

        {/* Dynamic Search Box */}
        <div className="relative flex-1 max-w-full md:max-w-[320px]">
          <Icons.Search className="absolute left-4 top-3 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar equipamiento..."
            className="w-full bg-card border border-border/80 rounded-full py-2.5 pl-11 pr-10 text-sm focus:outline-none focus:border-primary/80 focus:ring-4 focus:ring-primary/10 transition-all font-medium placeholder-muted-foreground/80 shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-2.5 text-muted-foreground hover:text-foreground rounded-full p-0.5 hover:bg-muted transition-all"
            >
              <Icons.X className="h-4.5 w-4.5" />
            </button>
          )}
        </div>

      </div>

      {/* 2. Category Tab Filters */}
      <div className="flex overflow-x-auto pb-1 scrollbar-none gap-2 -mx-1 px-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4.5 py-2 rounded-full text-xs font-extrabold transition-all relative flex items-center gap-2 border whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-primary/40 bg-primary/10 text-primary shadow-sm shadow-primary/10'
                  : 'border-border/60 bg-card/60 text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="activeTabGlow"
                  className="absolute inset-0 rounded-full bg-primary/5 border border-primary/30 -z-10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Selections Summary Indicator */}
      {currentSelections.length > 0 && (
        <div className="text-xs font-semibold text-muted-foreground flex items-center gap-2 px-1 animate-fadeIn">
          <Icons.CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
          <span>Tienes <strong className="text-foreground font-extrabold">{currentSelections.length}</strong> equipos seleccionados.</span>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-destructive hover:underline text-[11px] font-bold ml-auto cursor-pointer"
          >
            Deseleccionar todo
          </button>
        </div>
      )}

      {/* 3. Items Grid */}
      <AnimatePresence mode="popLayout">
        {filteredOptions.length > 0 ? (
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 w-full"
          >
            {filteredOptions.map((option) => {
              const isSelected = currentSelections.includes(option.value)

              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  key={option.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => toggleSelection(option.value)}
                  className={`p-4.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center justify-between min-h-[135px] relative group overflow-hidden ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/5'
                      : 'border-border/60 bg-card hover:border-primary/40 hover:shadow-md'
                  }`}
                >
                  {/* Decorative glowing background effect on hover when selected */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent -z-10 group-hover:opacity-100 opacity-60 transition-opacity" />
                  )}

                  {/* Corner Checkmark */}
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2.5 right-2.5 bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm"
                    >
                      <Icons.Check className="h-3 w-3 stroke-[3]" />
                    </motion.div>
                  )}

                  <div
                    className={`p-3 rounded-xl transition-colors mt-1 ${
                      isSelected ? 'bg-primary/20 text-primary font-bold' : 'bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/5'
                    }`}
                  >
                    {option.icon ? (
                      <IconResolver name={option.icon} className="h-6 w-6" />
                    ) : (
                      <Icons.Dumbbell className="h-6 w-6" />
                    )}
                  </div>

                  <div className="mt-3 flex flex-col gap-0.5">
                    <span className="text-sm font-extrabold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="text-[10px] text-muted-foreground font-semibold leading-normal line-clamp-1">
                        {option.description.replace('Espacio: ', '')}
                      </span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex flex-col items-center justify-center py-10 px-4 rounded-3xl border border-dashed border-border/80 text-center gap-3 bg-card/25"
          >
            <div className="p-4 bg-muted rounded-full text-muted-foreground/80">
              <Icons.ShieldAlert className="h-8 w-8" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-extrabold text-foreground text-base">No encontramos resultados</h3>
              <p className="text-xs text-muted-foreground font-medium max-w-[280px]">
                Prueba buscando otro término o cambia el filtro de categoría activo.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 bg-muted hover:bg-primary/10 border border-border/80 rounded-full text-xs font-bold text-foreground hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
            >
              Restablecer filtros
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
