import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { crearUsuario } from '../api/usuarios.js';
import { useUsuario } from '../context/UsuarioContext.js';
import { useAlturaTeclado } from '../hooks/useAlturaTeclado.js';
import { CargaEncima } from '../components/Carga.js';
import { Aviso, BotonPrincipal, Campo, CampoContrasenia, MIN_CONTRASENIA, emailValido } from '../components/Formulario.js';
import { colors, fontSize, spacing } from '../theme.js';

// Crear una cuenta. Si sale bien, se inicia sesión con ella y se entra a la app.
export default function Registro() {
  const { iniciarSesion } = useUsuario();
  const alturaTeclado = useAlturaTeclado();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [contrasenia, setContrasenia] = useState('');
  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorCrear, setErrorCrear] = useState(null);

  const errores = {
    nombre: nombre.trim() === '' ? 'Completá tu nombre.' : null,
    apellido: apellido.trim() === '' ? 'Completá tu apellido.' : null,
    email: email.trim() === '' ? 'Completá tu email.' : !emailValido(email) ? 'Revisá el email.' : null,
    contrasenia:
      contrasenia === '' ? 'Completá tu contraseña.'
        : contrasenia.length < MIN_CONTRASENIA ? `Tiene que tener al menos ${MIN_CONTRASENIA} caracteres.`
          : null,
  };
  const marcar = (campo) => (intentado ? errores[campo] : null);

  async function crear() {
    setErrorCrear(null);
    if (Object.values(errores).some(Boolean)) {
      setIntentado(true);
      return;
    }
    setEnviando(true);
    try {
      const cuenta = await crearUsuario({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim(),
        contrasenia,
      });
      iniciarSesion(cuenta);
      // Vuelve a la primera pantalla, que con la sesión iniciada entra al catálogo.
      router.dismissAll();
    } catch (e) {
      setErrorCrear(e.message);
      setEnviando(false);
    }
  }

  return (
    <View style={[styles.pantalla, { paddingBottom: alturaTeclado }]}>
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <Text style={styles.titulo}>Creá tu cuenta</Text>
        <Aviso>{errorCrear}</Aviso>

        <View style={styles.fila}>
          <Campo
            style={styles.mitad}
            etiqueta="Nombre"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Nombre"
            autoComplete="given-name"
            error={marcar('nombre')}
          />
          <Campo
            style={styles.mitad}
            etiqueta="Apellido"
            value={apellido}
            onChangeText={setApellido}
            placeholder="Apellido"
            autoComplete="family-name"
            error={marcar('apellido')}
          />
        </View>
        <Campo
          etiqueta="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="nombre@mail.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          error={marcar('email')}
        />
        <CampoContrasenia
          etiqueta="Contraseña"
          value={contrasenia}
          onChangeText={setContrasenia}
          placeholder="Tu contraseña"
          autoComplete="new-password"
          ayuda={`Al menos ${MIN_CONTRASENIA} caracteres.`}
          error={marcar('contrasenia')}
        />

        <BotonPrincipal titulo="Crear cuenta" onPress={crear} />

        <Pressable style={styles.link} onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.linkTexto}>
            ¿Ya tenés cuenta? <Text style={styles.linkAccion}>Iniciá sesión</Text>
          </Text>
        </Pressable>
      </ScrollView>

      {enviando ? <CargaEncima mensaje="Creando tu cuenta…" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contenido: {
    padding: spacing.lg,
  },
  titulo: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: 'bold',
  },
  fila: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mitad: {
    flex: 1,
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
