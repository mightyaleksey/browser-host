import babel from 'rollup-plugin-babel';
import builtins from 'rollup-plugin-node-builtins';
import commonjs from 'rollup-plugin-commonjs';
import globals from 'rollup-plugin-node-globals';
import resolve from 'rollup-plugin-node-resolve';

export default {
  input: 'browser/reporter.js',
  output: {
    file: 'bundle/reporter.js',
    format: 'iife',
    indent: false,
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
  plugins: [
    babel(),
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
