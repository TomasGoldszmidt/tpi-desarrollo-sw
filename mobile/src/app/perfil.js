import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { actualizarUsuario } from '../api/usuarios.js';
import { useUsuario } from '../context/UsuarioContext.js';
import { useAvisos } from '../context/AvisosContext.js';
import { useAlturaTeclado } from '../hooks/useAlturaTeclado.js';
import { useLayout } from '../hooks/useLayout.js';
import { Avatar } from '../components/Avatar.js';
import { Boton } from '../components/Boton.js';
import { CargaEncima } from '../components/Carga.js';
import { Aviso, Campo, CampoContrasenia, MIN_CONTRASENIA, emailValido } from '../components/Formulario.js';
import { colors, fontSize, spacing } from '../theme.js';

// Editar el perfil del usuario que inició sesión, en dos bloques con su propio botón:
// los datos ("Guardar datos" se activa recién cuando cambia algo) y la contraseña, que se
// abre con "Cambiar contraseña". Al guardar, el aviso de abajo lo confirma y se va solo.
export default function Perfil() {
  const { usuario, actualizarCuenta } = useUsuario();
  const avisos = useAvisos();
  const alturaTeclado = useAlturaTeclado();
  const { esTelefono } = useLayout();
  const [nombre, setNombre] = useState(usuario.nombre);
  const [apellido, setApellido] = useState(usuario.apellido);
  const [email, setEmail] = useState(usuario.email);
  const [intentadoDatos, setIntentadoDatos] = useState(false);
  const [errorDatos, setErrorDatos] = useState(null);

  const [cambiandoContrasenia, setCambiandoContrasenia] = useState(false);
  const [contraseniaActual, setContraseniaActual] = useState('');
  const [contraseniaNueva, setContraseniaNueva] = useState('');
  const [intentadoContrasenia, setIntentadoContrasenia] = useState(false);
  const [errorContrasenia, setErrorContrasenia] = useState(null);
  const [enviando, setEnviando] = useState(null);

  const erroresDatos = {
    nombre: nombre.trim() === '' ? 'Completá tu nombre.' : null,
    apellido: apellido.trim() === '' ? 'Completá tu apellido.' : null,
    email: email.trim() === '' ? 'Completá tu email.' : !emailValido(email) ? 'Revisá el email.' : null,
  };
  const erroresContrasenia = {
    actual: contraseniaActual === '' ? 'Ingresá tu contraseña actual.' : null,
    nueva: contraseniaNueva === '' ? 'Ingresá la nueva contraseña.'
      : contraseniaNueva.length < MIN_CONTRASENIA ? `Tiene que tener al menos ${MIN_CONTRASENIA} caracteres.` : null,
  };

  // Solo se manda lo que cambió.
  const cambios = {};
  if (nombre.trim() !== usuario.nombre) cambios.nombre = nombre.trim();
  if (apellido.trim() !== usuario.apellido) cambios.apellido = apellido.trim();
  if (email.trim().toLowerCase() !== usuario.email) cambios.email = email.trim();
  const hayCambios = Object.keys(cambios).length > 0;

  async function guardar(mensaje, datos, alTerminar) {
    setEnviando(mensaje);
    try {
      const cuenta = await actualizarUsuario(usuario.id, datos);
      actualizarCuenta(cuenta);
      alTerminar(cuenta);
      return true;
    } catch (e) {
      return e.message;
    } finally {
      setEnviando(null);
    }
  }

  async function guardarDatos() {
    setErrorDatos(null);
    if (Object.values(erroresDatos).some(Boolean)) {
      setIntentadoDatos(true);
      return;
    }
    const resultado = await guardar('Guardando tus datos…', cambios, (cuenta) => {
      setNombre(cuenta.nombre);
      setApellido(cuenta.apellido);
      setEmail(cuenta.email);
      setIntentadoDatos(false);
    });
    if (resultado === true) avisos.mostrar('Guardamos tus datos.');
    else setErrorDatos(resultado);
  }

  async function guardarContrasenia() {
    setErrorContrasenia(null);
    if (Object.values(erroresContrasenia).some(Boolean)) {
      setIntentadoContrasenia(true);
      return;
    }
    const resultado = await guardar('Cambiando tu contraseña…', { contraseniaActual, contraseniaNueva }, () => {
      cerrarContrasenia();
    });
    if (resultado === true) avisos.mostrar('Cambiamos tu contraseña.');
    else setErrorContrasenia(resultado);
  }

  function cerrarContrasenia() {
    setCambiandoContrasenia(false);
    setContraseniaActual('');
    setContraseniaNueva('');
    setIntentadoContrasenia(false);
    setErrorContrasenia(null);
  }

  return (
    <View style={[styles.pantalla, { paddingBottom: alturaTeclado }]}>
      <ScrollView contentContainerStyle={styles.contenido} keyboardShouldPersistTaps="handled">
        <View style={styles.formulario}>
          <View style={styles.encabezado}>
            <Avatar usuario={usuario} size={64} />
            <View style={styles.encabezadoTexto}>
              <Text style={styles.titulo}>
                {usuario.nombre} {usuario.apellido}
              </Text>
              <Text style={styles.email}>{usuario.email}</Text>
            </View>
          </View>

          <Text style={styles.subtitulo}>Tus datos</Text>
          <View style={!esTelefono && styles.fila}>
            <Campo
              style={!esTelefono && styles.mitad}
              etiqueta="Nombre"
              value={nombre}
              onChangeText={setNombre}
              autoComplete="given-name"
              error={intentadoDatos ? erroresDatos.nombre : null}
            />
            <Campo
              style={!esTelefono && styles.mitad}
              etiqueta="Apellido"
              value={apellido}
              onChangeText={setApellido}
              autoComplete="family-name"
              error={intentadoDatos ? erroresDatos.apellido : null}
            />
          </View>
          <Campo
            etiqueta="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            error={intentadoDatos ? erroresDatos.email : null}
          />
          <Aviso>{errorDatos}</Aviso>
          <Boton titulo="Guardar datos" onPress={guardarDatos} disabled={!hayCambios} style={styles.boton} />
          {!hayCambios ? <Text style={styles.ayuda}>Se activa cuando cambiás algo.</Text> : null}

          <Text style={styles.subtitulo}>Contraseña</Text>
          {cambiandoContrasenia ? (
            <>
              <CampoContrasenia
                etiqueta="Contraseña actual"
                value={contraseniaActual}
                onChangeText={setContraseniaActual}
                autoComplete="current-password"
                error={intentadoContrasenia ? erroresContrasenia.actual : null}
              />
              <CampoContrasenia
                etiqueta="Nueva contraseña"
                value={contraseniaNueva}
                onChangeText={setContraseniaNueva}
                autoComplete="new-password"
                ayuda={`Al menos ${MIN_CONTRASENIA} caracteres`}
                ayudaCumplida={contraseniaNueva.length >= MIN_CONTRASENIA}
                error={intentadoContrasenia ? erroresContrasenia.nueva : null}
              />
              <Aviso>{errorContrasenia}</Aviso>
              <Boton titulo="Guardar contraseña" onPress={guardarContrasenia} style={styles.boton} />
              <Boton titulo="Cancelar" variante="texto" onPress={cerrarContrasenia} />
            </>
          ) : (
            <Boton
              titulo="Cambiar contraseña"
              variante="secundario"
              icono="lock-closed-outline"
              onPress={() => setCambiandoContrasenia(true)}
            />
          )}
        </View>
      </ScrollView>

      {enviando ? <CargaEncima mensaje={enviando} /> : null}
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
    paddingBottom: spacing.xxl * 3,
  },
  formulario: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  encabezadoTexto: {
    flex: 1,
  },
  titulo: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: 'bold',
  },
  email: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
  },
  fila: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  mitad: {
    flex: 1,
  },
  subtitulo: {
    color: colors.textSecondary,
    fontSize: fontSize.small,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  boton: {
    marginTop: spacing.lg,
  },
  ayuda: {
    color: colors.textMuted,
    fontSize: fontSize.caption,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
});
