{ pkgs ? import <nixpkgs> }:
with pkgs;
mkShell {
  buildInputs = [ nodejs yarn nixpkgs-fmt bash ];
}
