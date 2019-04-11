import builtins from 'rollup-plugin-node-builtins';
import commonjs from 'rollup-plugin-commonjs';
import globals from 'rollup-plugin-node-globals';
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'test.js',
  output: {
    format: 'iife',
    indent: false,
    name: 'f',
  },
  onwarn(warning, rollupWarn) {
    if (
      warning.code === 'CIRCULAR_DEPENDENCY' &&
      warning.importer.includes('readable-stream')
    ) {
      return;
    }

    rollupWarn(warning);
  },
  shimMissingExports: true,
  plugins: [
    resolve({
      mainFields: ['browserify', 'main'],
      preferBuiltins: true,
    }),
    commonjs(),
    builtins(),
    globals({
      dirname: false,
      filename: false,
      baseDir: false,
    }),
  ],
};
