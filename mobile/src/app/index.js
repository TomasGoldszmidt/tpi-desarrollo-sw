import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';
import { iniciarSesion } from '../api/sesiones.js';
import { useUsuario } from '../context/UsuarioContext.js';
import { useAlturaTeclado } from '../hooks/useAlturaTeclado.js';
import { CargaEncima } from '../components/Carga.js';
import { Aviso, BotonPrincipal, Campo, CampoContrasenia, emailValido } from '../components/Formulario.js';
import { Logo, Marca } from '../components/Logo.js';
import { colors, fontSize, spacing } from '../theme.js';

// Primera pantalla: iniciar sesión con email y contraseña. Desde acá se va a crear una cuenta.
export default function IniciarSesion() {
  const { usuario, iniciarSesion: entrar } = useUsuario();
  const alturaTeclado = useAlturaTeclado();
  const [email, setEmail] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorIngreso, setErrorIngreso] = useState(null);

  // Con la sesión ya iniciada (ej: se acaba de crear la cuenta) se va directo a la app.
  if (usuario) {
    return <Redirect href="/catalogo" />;
  }

  const errores = {
    email: email.trim() === '' ? 'Completá tu email.' : !emailValido(email) ? 'Revisá el email.' : null,
    contrasenia: contrasenia === '' ? 'Completá tu contraseña.' : null,
  };

  async function ingresar() {
    setErrorIngreso(null);
    if (errores.email || errores.contrasenia) {
      setIntentado(true);
      return;
    }
    setEnviando(true);
    try {
      const cuenta = await iniciarSesion(email.trim(), contrasenia);
      // Con la sesión iniciada, la pantalla se redirige sola al catálogo.
      entrar(cuenta);
    } catch (e) {
      setErrorIngreso(e.message);
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={[styles.pantalla, { paddingBottom: alturaTeclado }]}>
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <View style={styles.encabezado}>
          <Logo size="large" />
          <Marca fontSize={28} />
          <Text style={styles.lema}>ENTRADAS A UN CLICK</Text>
        </View>

        <Text style={styles.titulo}>Iniciá sesión</Text>
        <Aviso>{errorIngreso}</Aviso>

        <Campo
          etiqueta="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="nombre@mail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          error={intentado ? errores.email : null}
        />
        <CampoContrasenia
          etiqueta="Contraseña"
          value={contrasenia}
          onChangeText={setContrasenia}
          placeholder="Tu contraseña"
          autoComplete="current-password"
          onSubmitEditing={ingresar}
          error={intentado ? errores.contrasenia : null}
        />

        <BotonPrincipal titulo="Ingresar" onPress={ingresar} />

        <Pressable style={styles.link} onPress={() => router.push('/registro')} hitSlop={8}>
          <Text style={styles.linkTexto}>
            ¿No tenés cuenta? <Text style={styles.linkAccion}>Creá una</Text>
          </Text>
        </Pressable>
      </ScrollView>

      {enviando ? <CargaEncima mensaje="Ingresando…" /> : null}
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
  titulo: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: 'bold',
  },
  link: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  linkTexto: {
    color: colors.textSecondary,
    fontSize: fontSize.body,
  },
  linkAccion: {
    color: colors.primary,
    fontWeight: 'bold',
  },
});
