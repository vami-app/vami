"use strict";

/**
 * Node in the PrefixTrie structure.
 */
class TrieNode {
  constructor() {
    this.children = {};
    this.isWord = false;
    this.word = null;
  }
}

/**
 * FAANG-grade PrefixTrie for O(k) prefix autocomplete matching.
 * Blueprint §4.6 DSA specification.
 */
class PrefixTrie {
  constructor() {
    this.root = new TrieNode();
  }

  /**
   * Insert a string into the trie.
   * @param {string} word
   */
  insert(word) {
    if (!word) return;
    const normalized = String(word).toLowerCase().trim();
    if (!normalized) return;

    let curr = this.root;
    for (const char of normalized) {
      if (!curr.children[char]) {
        curr.children[char] = new TrieNode();
      }
      curr = curr.children[char];
    }
    curr.isWord = true;
    curr.word = normalized;
  }

  /**
   * Bulk insert array of strings.
   * @param {string[]} words
   */
  insertMany(words) {
    if (Array.isArray(words)) {
      for (const w of words) this.insert(w);
    }
  }

  /**
   * Return up to `limit` words starting with `prefix`.
   * @param {string} prefix
   * @param {number} [limit=10]
   * @returns {string[]}
   */
  autocomplete(prefix, limit = 10) {
    if (!prefix) return [];
    const normalized = String(prefix).toLowerCase().trim();
    if (!normalized) return [];

    let curr = this.root;
    for (const char of normalized) {
      if (!curr.children[char]) return [];
      curr = curr.children[char];
    }

    const results = [];
    this._dfs(curr, results, limit);
    return results;
  }

  /**
   * Depth-first traversal to collect word matches.
   * @private
   */
  _dfs(node, results, limit) {
    if (results.length >= limit) return;
    if (node.isWord && node.word) {
      results.push(node.word);
    }
    for (const char of Object.keys(node.children).sort()) {
      if (results.length >= limit) break;
      this._dfs(node.children[char], results, limit);
    }
  }
}

module.exports = PrefixTrie;
