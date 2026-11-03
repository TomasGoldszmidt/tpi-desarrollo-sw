import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { getUsuarios } from '../api/usuarios.js';
import { API_URL } from '../config.js';
import { useUsuario } from '../context/UsuarioContext.js';
import { Avatar } from '../components/Avatar.js';
import { EstadoCarga } from '../components/EstadoCarga.js';
import { Logo, Marca } from '../components/Logo.js';
import { colors, fontSize, spacing } from '../theme.js';

// Primera pantalla: elegir con qué usuario usar la app (no hay login).
export default function ElegirUsuario() {
  const { elegirUsuario } = useUsuario();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsuarios(await getUsuarios());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function entrar(usuario) {
    elegirUsuario(usuario);
    router.replace('/catalogo');
  }

  const conLista = !loading && !error;

  return (
    <SafeAreaView style={styles.pantalla}>
      <ScrollView contentContainerStyle={[styles.contenido, !conLista && styles.centrado]}>
        <View style={styles.encabezado}>
          <Logo size="large" />
          <Marca fontSize={28} />
          {conLista ? <Text style={styles.lema}>ENTRADAS A UN CLICK</Text> : null}
        </View>

        {conLista ? (
          <>
            <Text style={styles.pregunta}>¿Quién usa la app?</Text>
            {usuarios.map((usuario) => (
              <Pressable
                key={usuario.id}
                style={({ pressed }) => [styles.fila, pressed && styles.filaPresionada]}
                onPress={() => entrar(usuario)}
              >
                <Avatar usuario={usuario} size={36} />
                <Text style={styles.nombre}>
                  {usuario.nombre} {usuario.apellido}
                </Text>
              </Pressable>
            ))}
            <Text style={styles.backend}>Backend: {API_URL.replace('http://', '')}</Text>
          </>
        ) : (
          <EstadoCarga
            loading={loading}
            error={error}
            detalle={`${API_URL}\nRevisá que esté levantado.`}
            onRetry={cargar}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenido: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  centrado: {
    justifyContent: 'center',
  },
  encabezado: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  lema: {
    color: colors.textMuted,
    fontSize: fontSize.small,
    letterSpacing: 1,
  },
  pregunta: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  filaPresionada: {
    backgroundColor: colors.primarySoft,
  },
  nombre: {
    color: colors.text,
    fontSize: 16,
  },
  backend: {
    color: colors.textMuted,
    fontSize: fontSize.small,
    marginTop: spacing.lg,
  },
});
