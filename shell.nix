{ pkgs ? import <nixpkgs> {}}:
let
  NPM_CONFIG_PREFIX = toString ./npm_config_prefix;
in pkgs.mkShell {

  nativeBuildInputs = with pkgs; [
    # NodeJS stuff
    nodejs
    nodePackages.npm
    yarn
    # Stripe
    stripe-cli
  ];

  shellHook = ''
    export PATH="${NPM_CONFIG_PREFIX}/bin:$HOME/.npm-global/bin:$PATH"
  '';


}

