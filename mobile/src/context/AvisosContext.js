import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors, fontSize, spacing } from '../theme.js';

const AvisosContext = createContext(null);
const DURACION_MS = 4000;

// Aviso corto abajo de la pantalla después de una acción ("Pagaste tu compra"), que se
// va solo. Puede traer una acción ("Deshacer"). Uno por vez: el nuevo reemplaza al anterior.
export function AvisosProvider({ children }) {
  const insets = useSafeAreaInsets();
  const [aviso, setAviso] = useState(null);

  const mostrar = useCallback((texto, accion = null) => {
    setAviso({ texto, accion, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!aviso) return undefined;
    const timer = setTimeout(() => setAviso(null), DURACION_MS);
    return () => clearTimeout(timer);
  }, [aviso]);

  const valor = useMemo(() => ({ mostrar }), [mostrar]);

  return (
    <AvisosContext.Provider value={valor}>
      {children}
      {aviso ? (
        // Queda arriba de las pestañas de abajo (~64) para no taparlas.
        <View style={[styles.aviso, { bottom: insets.bottom + 76 }]} accessibilityLiveRegion="polite" pointerEvents="box-none">
          <Ionicons name="checkmark-circle" size={20} color={colors.brand} />
          <Text style={styles.texto}>{aviso.texto}</Text>
          {aviso.accion ? (
            <Pressable
              onPress={() => {
                aviso.accion.onPress();
                setAviso(null);
              }}
              hitSlop={10}
              accessibilityRole="button"
            >
              <Text style={styles.accion}>{aviso.accion.titulo}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </AvisosContext.Provider>
  );
}

export function useAvisos() {
  return useContext(AvisosContext);
}

const styles = StyleSheet.create({
  aviso: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    maxWidth: 560,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.text,
    borderRadius: 10,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    elevation: 6,
  },
  texto: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: fontSize.body,
  },
  accion: {
    color: '#9FE07A',
    fontSize: fontSize.body,
    fontWeight: 'bold',
  },
});
